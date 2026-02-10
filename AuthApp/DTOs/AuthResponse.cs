namespace AuthApp.DTOs;

public class AuthResponse
{
    public string AccessToken { get; set; } = "";
    public string RefreshToken { get; set; } = "";
    public int RefreshTokenId { get; set; }
    public object User { get; set; } = new { };
}
