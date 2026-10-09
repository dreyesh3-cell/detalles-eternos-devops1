using ApiCatalogo.Data;
using ApiCatalogo.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace ApiCatalogo.Controllers;

[ApiController]
[Route("api/catalogo")]
public class ProductosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public ProductosController(
    AppDbContext context,
    IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpGet("productos")]
    public async Task<IActionResult> ObtenerProductos(
    [FromQuery] string? q,
    [FromQuery] string? categoria,
    [FromQuery] decimal? min,
    [FromQuery] decimal? max,
    [FromQuery] int? disponibles,
    [FromQuery] int? envio_nacional,
    [FromQuery] bool? destacado,
    [FromQuery] string? ids,
    [FromQuery] string? orden,
    [FromQuery] int pagina = 1,
    [FromQuery] int por_pagina = 12)
    {
        var consulta = _context.Productos
            .Where(p => p.activo)
            .AsQueryable();

        pagina = Math.Max(1, pagina);
        por_pagina = Math.Max(1, por_pagina);

        // Búsqueda por nombre o descripción
        if (!string.IsNullOrWhiteSpace(q))
        {
            consulta = consulta.Where(p =>
                p.nombre.ToLower().Contains(q.ToLower()) ||
                p.descripcion.ToLower().Contains(q.ToLower()));
        }

        // Filtro por categorías
        if (!string.IsNullOrWhiteSpace(categoria))
        {
            var categorias = categoria
                .Split(',', StringSplitOptions.RemoveEmptyEntries);

            consulta = consulta.Where(p =>
                categorias.Contains(p.categoria));
        }

        // Precio mínimo
        if (min.HasValue)
        {
            consulta = consulta.Where(p => p.precio >= min.Value);
        }

        // Precio máximo
        if (max.HasValue)
        {
            consulta = consulta.Where(p => p.precio <= max.Value);
        }

        // Solo productos disponibles
        if (disponibles == 1)
        {
            consulta = consulta.Where(p => p.stock > 0);
        }
        // Envio nacional
        if (envio_nacional == 1)
        {
            consulta = consulta.Where(p => p.tipo == "normal");
        }
        // Destacado
        if (destacado == true)
        {
            consulta = consulta.Where(p => p.destacado);
        }
        //productos especificos
        if (!string.IsNullOrWhiteSpace(ids))
        {
            var idsProductos = ids
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(int.Parse)
                .ToList();

            consulta = consulta.Where(p => idsProductos.Contains(p.id));
        }

        // Ordenamiento
        consulta = orden switch
        {
            "vendidos" => consulta.OrderByDescending(p => p.ventas),
            "precio_asc" => consulta.OrderBy(p => p.precio),
            "precio_desc" => consulta.OrderByDescending(p => p.precio),
            "nuevos" => consulta.OrderByDescending(p => p.id),
            "nombre" => consulta.OrderBy(p => p.nombre),
            _ => consulta.OrderByDescending(p => p.ventas)
        };

        var total = await consulta.CountAsync();

        var paginas = (int)Math.Ceiling((double)total / por_pagina);

        var productos = await consulta
            .Skip((pagina - 1) * por_pagina)
            .Take(por_pagina)
            .ToListAsync();

        return Ok(new
        {
            total = total,
            pagina = pagina,
            paginas = paginas,
            por_pagina = por_pagina,
            data = productos
        });
    }

    [HttpGet("categorias")]
    public async Task<IActionResult> ObtenerCategorias()
    {
        var categorias = await _context.Productos
            .Where(p => p.activo)
            .GroupBy(p => p.categoria)
            .Select(g => new
            {
                categoria = g.Key,
                total = g.Count()
            })
            .OrderBy(x => x.categoria)
            .ToListAsync();

        return Ok(categorias);
    }

    [HttpGet("productos/{id:int}")]
    public async Task<IActionResult> ObtenerProducto(int id)
    {
        var producto = await _context.Productos
            .Where(p => p.activo)
            .FirstOrDefaultAsync(p => p.id == id);

        if (producto == null)
        {
            return NotFound(new
            {
                detail = "Producto no encontrado"
            });
        }

        return Ok(producto);
    }

    [Authorize(Roles = "admin")]
    [HttpPost("productos")]
    public async Task<IActionResult> CrearProducto(
    [FromForm] CrearProductoRequest request,
    IFormFile? imagen)
    {
        if (imagen == null)
        {
            return BadRequest("No se recibió ninguna imagen.");
        }

        if (imagen.Length == 0)
        {
            return BadRequest("La imagen llegó vacía.");
        }

        var producto = new Producto
        {
            nombre = request.nombre,
            categoria = request.categoria,
            precio = request.precio,
            precio_mayorista = request.precio_mayorista,
            minimo_mayorista = request.minimo_mayorista,
            stock = request.stock,
            peso_lb = request.peso_lb,
            tipo = request.tipo,
            destacado = request.destacado,
            ventas = request.ventas,
            descripcion = request.descripcion
        };

        Console.WriteLine($"ID antes de guardar: {producto.id}");
        _context.Productos.Add(producto);

        await _context.SaveChangesAsync();

        var extension = Path.GetExtension(imagen.FileName);
        var nombreArchivo = $"producto-{producto.id}{extension}";

        var carpeta = Path.Combine(
            Directory.GetCurrentDirectory(),
            "uploads"
        );

        Directory.CreateDirectory(carpeta);

        var rutaArchivo = Path.Combine(carpeta, nombreArchivo);

        using (var stream = new FileStream(rutaArchivo, FileMode.Create))
        {
            await imagen.CopyToAsync(stream);
        }

        producto.imagen_url = $"/uploads/{nombreArchivo}";

        await _context.SaveChangesAsync();

        return Ok(producto);
    }

    [Authorize(Roles = "admin")]
    [HttpPut("productos/{id:int}")]
    public async Task<IActionResult> ActualizarProducto(
    int id,
    [FromForm] CrearProductoRequest request,
    IFormFile? imagen)
    {
        var producto = await _context.Productos
            .FirstOrDefaultAsync(p => p.id == id);

        if (producto == null)
        {
            return NotFound(new
            {
                detail = "Producto no encontrado"
            });
        }

        producto.nombre = request.nombre;
        producto.categoria = request.categoria;
        producto.precio = request.precio;
        producto.precio_mayorista = request.precio_mayorista;
        producto.minimo_mayorista = request.minimo_mayorista;
        producto.stock = request.stock;
        producto.peso_lb = request.peso_lb;
        producto.tipo = request.tipo;
        producto.destacado = request.destacado;
        producto.descripcion = request.descripcion;

        if (imagen != null && imagen.Length > 0)
        {
            var extension = Path.GetExtension(imagen.FileName);
            var nombreArchivo = $"producto-{producto.id}{extension}";

            var carpeta = Path.Combine(
                Directory.GetCurrentDirectory(),
                "uploads"
            );

            Directory.CreateDirectory(carpeta);

            var rutaArchivo = Path.Combine(carpeta, nombreArchivo);

            using (var stream = new FileStream(rutaArchivo, FileMode.Create))
            {
                await imagen.CopyToAsync(stream);
            }

            producto.imagen_url = $"/uploads/{nombreArchivo}";
        }

        await _context.SaveChangesAsync();

        return Ok(producto);
    }

    [Authorize(Roles = "admin")]
    [HttpPatch("productos/{id:int}/stock")]
    public async Task<IActionResult> ActualizarStock(
    int id,
    [FromBody] ActualizarStockRequest request)
    {
        var producto = await _context.Productos
            .FirstOrDefaultAsync(p => p.id == id);

        if (producto == null)
        {
            return NotFound(new
            {
                detail = "Producto no encontrado"
            });
        }

        if (request.stock < 0)
        {
            return BadRequest(new
            {
                detail = "El stock no puede ser negativo"
            });
        }

        producto.stock = request.stock;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            id = producto.id,
            stock = producto.stock
        });
    }

    [Authorize(Roles = "admin")]
    [HttpDelete("productos/{id:int}")]
    public async Task<IActionResult> EliminarProducto(int id)
    {
        var producto = await _context.Productos
            .FirstOrDefaultAsync(p => p.id == id);

        if (producto == null)
        {
            return NotFound(new
            {
                detail = "Producto no encontrado"
            });
        }

        producto.activo = false;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            detail = "Producto desactivado correctamente",
            id = producto.id
        });
    }

    [Authorize(Roles = "admin")]
    [HttpGet("inventario/alertas")]
    public async Task<IActionResult> ObtenerAlertasInventario()
    {
        var stockAlerta = _configuration
            .GetValue<int>("Inventario:StockAlerta");

        var productos = await _context.Productos
            .Where(p => p.activo && p.stock <= stockAlerta)
            .OrderBy(p => p.stock)
            .ThenBy(p => p.nombre)
            .ToListAsync();

        return Ok(productos);
    }
}