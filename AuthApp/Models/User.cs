namespace AuthApp.Models;

public class User
{
    public int Id { get; set; }

    public string Name { get; set; } = "";
    public string Email { get; set; } = "";

    public string PasswordHash { get; set; } = "";

    public string Role { get; set; } = "user";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<RefreshToken> RefreshTokens { get; set; } = new();
}
