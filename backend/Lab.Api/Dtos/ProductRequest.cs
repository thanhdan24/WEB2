using System.ComponentModel.DataAnnotations;

namespace Lab.Api.Dtos;

// Không nhận Id từ client: Id do database sinh ra.
public class ProductRequest
{
    [Required(ErrorMessage = "Tên sản phẩm là bắt buộc.")]
    [StringLength(100, ErrorMessage = "Tên không được quá 100 ký tự.")]
    public string Name { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Mô tả không được quá 500 ký tự.")]
    public string? Description { get; set; }

    [Range(typeof(decimal), "0", "1000000000", ErrorMessage = "Giá từ 0 đến 1 tỷ.")]
    public decimal Price { get; set; }

    [Range(0, 1000000, ErrorMessage = "Số lượng từ 0 đến 1 triệu.")]
    public int Quantity { get; set; }
}
