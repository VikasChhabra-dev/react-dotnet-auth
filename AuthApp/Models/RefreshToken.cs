namespace AuthApp.Models;

public class RefreshToken
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string Token { get; set; } = "";
    public DateTime ExpiresAt { get; set; }

    public bool Revoked { get; set; } = false;
    public DateTime? RevokedAt { get; set; }

    public string? ReplacedByToken { get; set; }

    public bool ReuseDetected { get; set; } = false;

    public string? Device { get; set; }
    public string? IpAddress { get; set; }
    public DateTime? LastUsedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
