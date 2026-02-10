using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthApp.Controllers
{

    [ApiController]
    [Route("api/test")]
    public class TestController : ControllerBase
    {
        [Authorize]
        [HttpGet("secure")]
        public IActionResult Secure()
        {
            return Ok(new
            {
                message = "Secure API working! Access token valid ✅",
                time = DateTime.UtcNow.ToString("u")
            });
        }

        [Authorize(Roles = "admin")]
        [HttpGet("admin")]
        public IActionResult Admin()
        {
            return Ok(new
            {
                message = "Admin API working! Role = admin ✅",
                time = DateTime.UtcNow.ToString("u")
            });
        }
    }
}
