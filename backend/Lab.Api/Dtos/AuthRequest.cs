using System.ComponentModel.DataAnnotations;

namespace Lab.Api.Dtos;

public class AuthRequest
{
    [Required(ErrorMessage = "Vui lòng nhập email.")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
    [StringLength(254, ErrorMessage = "Email tối đa 254 ký tự.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập mật khẩu.")]
    [StringLength(128, MinimumLength = 8, ErrorMessage = "Mật khẩu cần từ 8 đến 128 ký tự.")]
    [RegularExpression(@".*\S.*", ErrorMessage = "Mật khẩu không được chỉ chứa khoảng trắng.")]
    public string Password { get; set; } = string.Empty;
}
