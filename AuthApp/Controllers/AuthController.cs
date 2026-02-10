using AuthApp.Data;
using AuthApp.DTOs;
using AuthApp.Models;
using AuthApp.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AuthApp.Controllers
{

    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly JwtService _jwtService;
        private readonly RefreshTokenService _refreshService;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext db, JwtService jwtService, RefreshTokenService refreshService, IConfiguration config)
        {
            _db = db;
            _jwtService = jwtService;
            _refreshService = refreshService;
            _config = config;
        }

        private string GetIpAddress()
        {
            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }

        private string GetDevice()
        {
            return Request.Headers.UserAgent.ToString();
        }

        private int GetCurrentUserId()
        {
            var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.Parse(id!);
        }

        private async Task RevokeAllRefreshTokensForUser(int userId)
        {
            var tokens = await _db.RefreshTokens
                .Where(x => x.UserId == userId && x.Revoked == false)
                .ToListAsync();

            foreach (var t in tokens)
            {
                t.Revoked = true;
                t.RevokedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
        }

        private async Task<AuthResponse> CreateAuthResponse(User user)
        {
            var accessToken = _jwtService.CreateAccessToken(user);

            var refreshToken = _refreshService.GenerateRefreshToken();
            var refreshDays = int.Parse(_config["Jwt:RefreshTokenDays"]!);

            var refreshEntity = new RefreshToken
            {
                UserId = user.Id,
                Token = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(refreshDays),
                Revoked = false,

                Device = GetDevice(),
                IpAddress = GetIpAddress(),
                LastUsedAt = DateTime.UtcNow
            };

            _db.RefreshTokens.Add(refreshEntity);
            await _db.SaveChangesAsync();

            return new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                RefreshTokenId = refreshEntity.Id,
                User = new
                {
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Role
                }
            };
        }

        private async Task<User> FindOrCreateSocialUser(string provider, string providerId, string email, string name)
        {
            var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == email);

            if (user == null)
            {
                user = new User
                {
                    Name = name,
                    Email = email,
                    PasswordHash = "",
                    Role = "user"
                };

                _db.Users.Add(user);
                await _db.SaveChangesAsync();
            }

            return user;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest("Email and Password are required");

            var exists = await _db.Users.AnyAsync(x => x.Email == req.Email);
            if (exists)
                return BadRequest("Email already exists");

            var hash = BCrypt.Net.BCrypt.HashPassword(req.Password);

            var user = new User
            {
                Name = req.Name,
                Email = req.Email,
                PasswordHash = hash,
                Role = "user"
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return Ok("User registered successfully");
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
        {
            var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == req.Email);

            if (user == null)
                return Unauthorized("Invalid email or password");

            if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
                return Unauthorized("Invalid email or password");

            if (user.Email.ToLower() == "admin@gmail.com")
            {
                user.Role = "admin";
                await _db.SaveChangesAsync();
            }

            return Ok(await CreateAuthResponse(user));
        }

        [HttpPost("refresh")]
        public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest req)
        {
            var token = await _db.RefreshTokens
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.Token == req.RefreshToken);

            if (token == null)
                return Unauthorized("Invalid refresh token");

            if (token.Revoked)
            {
                token.ReuseDetected = true;
                await _db.SaveChangesAsync();

                await RevokeAllRefreshTokensForUser(token.UserId);

                return Unauthorized("Refresh token reuse detected. Logged out from all devices.");
            }

            if (token.ExpiresAt < DateTime.UtcNow)
                return Unauthorized("Refresh token expired");

            token.LastUsedAt = DateTime.UtcNow;

            token.Revoked = true;
            token.RevokedAt = DateTime.UtcNow;

            var newRefreshToken = _refreshService.GenerateRefreshToken();
            token.ReplacedByToken = newRefreshToken;

            var refreshDays = int.Parse(_config["Jwt:RefreshTokenDays"]!);

            var newTokenEntity = new RefreshToken
            {
                UserId = token.UserId,
                Token = newRefreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(refreshDays),
                Revoked = false,

                Device = GetDevice(),
                IpAddress = GetIpAddress(),
                LastUsedAt = DateTime.UtcNow
            };

            _db.RefreshTokens.Add(newTokenEntity);
            await _db.SaveChangesAsync();

            var accessToken = _jwtService.CreateAccessToken(token.User);

            return Ok(new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = newRefreshToken,
                RefreshTokenId = newTokenEntity.Id,
                User = new
                {
                    token.User.Id,
                    token.User.Name,
                    token.User.Email,
                    token.User.Role
                }
            });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout(LogoutRequest req)
        {
            var token = await _db.RefreshTokens.FirstOrDefaultAsync(x => x.Token == req.RefreshToken);

            if (token == null)
                return Ok("Already logged out");

            token.Revoked = true;
            token.RevokedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok("Logged out successfully");
        }

        [HttpPost("google")]
        public async Task<ActionResult<AuthResponse>> GoogleLogin(GoogleLoginRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.IdToken))
                return BadRequest("Missing Google token");

            var http = new HttpClient();
            var url = $"https://oauth2.googleapis.com/tokeninfo?id_token={req.IdToken}";
            var response = await http.GetAsync(url);

            if (!response.IsSuccessStatusCode)
                return Unauthorized("Invalid Google token");

            var json = await response.Content.ReadAsStringAsync();
            using var doc = System.Text.Json.JsonDocument.Parse(json);

            var sub = doc.RootElement.GetProperty("sub").GetString();
            var email = doc.RootElement.GetProperty("email").GetString();
            var name = doc.RootElement.TryGetProperty("name", out var n) ? n.GetString() : "Google User";

            if (string.IsNullOrEmpty(sub) || string.IsNullOrEmpty(email))
                return Unauthorized("Google token missing data");

            var aud = doc.RootElement.GetProperty("aud").GetString();
            var expectedAud = _config["OAuth:GoogleClientId"];

            if (!string.IsNullOrEmpty(expectedAud) && aud != expectedAud)
                return Unauthorized("Google token audience mismatch");

            var user = await FindOrCreateSocialUser("google", sub!, email!, name!);

            return Ok(await CreateAuthResponse(user));
        }

        [HttpPost("facebook")]
        public async Task<ActionResult<AuthResponse>> FacebookLogin(FacebookLoginRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.AccessToken))
                return BadRequest("Missing Facebook access token");

            var http = new HttpClient();

            var url = $"https://graph.facebook.com/me?fields=id,name,email&access_token={req.AccessToken}";
            var response = await http.GetAsync(url);

            if (!response.IsSuccessStatusCode)
                return Unauthorized("Invalid Facebook token");

            var json = await response.Content.ReadAsStringAsync();
            using var doc = System.Text.Json.JsonDocument.Parse(json);

            var fbId = doc.RootElement.GetProperty("id").GetString();
            var name = doc.RootElement.TryGetProperty("name", out var n) ? n.GetString() : "Facebook User";

            var email = doc.RootElement.TryGetProperty("email", out var e) ? e.GetString() : null;

            if (string.IsNullOrEmpty(fbId))
                return Unauthorized("Facebook token missing id");

            if (string.IsNullOrEmpty(email))
                email = $"{fbId}@facebook.local";

            var user = await FindOrCreateSocialUser("facebook", fbId!, email!, name!);

            return Ok(await CreateAuthResponse(user));
        }

        [Authorize]
        [HttpGet("devices")]
        public async Task<IActionResult> GetMyDevices()
        {
            var userId = GetCurrentUserId();

            var devices = await _db.RefreshTokens
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new
                {
                    x.Id,
                    x.Device,
                    x.IpAddress,
                    x.CreatedAt,
                    x.LastUsedAt,
                    x.Revoked,
                    x.RevokedAt,
                    x.ReuseDetected
                })
                .ToListAsync();

            return Ok(devices);
        }

        [Authorize]
        [HttpPost("devices/logout-one/{refreshTokenId}")]
        public async Task<IActionResult> LogoutOneDevice(int refreshTokenId)
        {
            var userId = GetCurrentUserId();

            var token = await _db.RefreshTokens
                .FirstOrDefaultAsync(x => x.Id == refreshTokenId && x.UserId == userId);

            if (token == null)
                return NotFound("Device session not found");

            token.Revoked = true;
            token.RevokedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok("Device logged out");
        }

        [Authorize]
        [HttpPost("devices/logout-all")]
        public async Task<IActionResult> LogoutAllDevices()
        {
            var userId = GetCurrentUserId();

            var tokens = await _db.RefreshTokens
                .Where(x => x.UserId == userId && x.Revoked == false)
                .ToListAsync();

            foreach (var t in tokens)
            {
                t.Revoked = true;
                t.RevokedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();

            return Ok("Logged out from all devices");
        }

        [Authorize]
        [HttpPost("devices/logout-all-except-current")]
        public async Task<IActionResult> LogoutAllExceptCurrent(LogoutExceptRequest req)
        {
            var userId = GetCurrentUserId();

            var tokens = await _db.RefreshTokens
                .Where(x => x.UserId == userId && x.Revoked == false && x.Id != req.CurrentRefreshTokenId)
                .ToListAsync();

            foreach (var t in tokens)
            {
                t.Revoked = true;
                t.RevokedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();

            return Ok("Logged out from all devices except current");
        }
    }
}
