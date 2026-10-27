using Lab.Api.Data;
using Lab.Api.Dtos;
using Lab.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lab.Api.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController(AppDbContext db) : ControllerBase
{
    // GET /api/products
    [HttpGet]
    public async Task<ActionResult<List<Product>>> GetAll(CancellationToken ct)
        => Ok(await db.Products.AsNoTracking().OrderBy(p => p.Id).ToListAsync(ct));

    // GET /api/products/1
    [HttpGet("{id:int:min(1)}")]
    public async Task<ActionResult<Product>> GetById(int id, CancellationToken ct)
    {
        var product = await db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product is null) return NotFound(new { message = "Không tìm thấy sản phẩm." });
        return Ok(product);
    }

    // POST /api/products -- [ApiController] tự trả 400 nếu DTO không hợp lệ.
    [HttpPost]
    public async Task<ActionResult<Product>> Create(ProductRequest request, CancellationToken ct)
    {
        var product = new Product
        {
            Name = request.Name.Trim(), Description = request.Description?.Trim(),
            Price = request.Price, Quantity = request.Quantity
        };
        db.Products.Add(product);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }

    // PUT /api/products/1 -- thay toàn bộ các trường có thể sửa.
    [HttpPut("{id:int:min(1)}")]
    public async Task<IActionResult> Update(int id, ProductRequest request, CancellationToken ct)
    {
        var product = await db.Products.FindAsync(new object[] { id }, ct);
        if (product is null) return NotFound(new { message = "Không tìm thấy sản phẩm." });
        product.Name = request.Name.Trim();
        product.Description = request.Description?.Trim();
        product.Price = request.Price;
        product.Quantity = request.Quantity;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // DELETE /api/products/1
    [HttpDelete("{id:int:min(1)}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var product = await db.Products.FindAsync(new object[] { id }, ct);
        if (product is null) return NotFound(new { message = "Không tìm thấy sản phẩm." });
        db.Products.Remove(product);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
