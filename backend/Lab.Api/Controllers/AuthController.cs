using System.Security.Claims;
using System.Security.Cryptography;
using Lab.Api.Auth;
using Lab.Api.Data;
using Lab.Api.Dtos;
using Lab.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Lab.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, IPasswordHasher<User> hasher) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(AuthRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            return Conflict(new { message = "Email đã được đăng ký." });
        var user = new User { Email = email };
        user.PasswordHash = hasher.HashPassword(user, request.Password);
        db.Users.Add(user);
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateException e) when (e.InnerException is SqliteException { SqliteErrorCode: 19 })
        { return Conflict(new { message = "Email đã được đăng ký." }); }
        return StatusCode(201, new { user = new { user.Id, user.Email }, message = "Đăng ký thành công. Hãy đăng nhập." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(AuthRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == email, ct);
        if (user is null) return Unauthorized(new { message = "Email hoặc mật khẩu không đúng." });
        var result = hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
            return Unauthorized(new { message = "Email hoặc mật khẩu không đúng." });
        if (result == PasswordVerificationResult.SuccessRehashNeeded)
            user.PasswordHash = hasher.HashPassword(user, request.Password);
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var expiresAt = DateTime.UtcNow.AddDays(7);
        db.UserSessions.Add(new UserSession { UserId = user.Id, TokenHash = SessionAuthenticationHandler.HashToken(token), ExpiresAt = expiresAt });
        await db.SaveChangesAsync(ct);
        return Ok(new { token, expiresAt, user = new { user.Id, user.Email } });
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me() => Ok(new { id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!), email = User.FindFirstValue(ClaimTypes.Email) });

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var hash = User.FindFirstValue("session");
        await db.UserSessions.Where(s => s.TokenHash == hash).ExecuteDeleteAsync(ct);
        return NoContent();
    }
}
