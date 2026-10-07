using System.Security.Claims;
using ApiAuth.Data;
using ApiAuth.Models;
using ApiAuth.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;

namespace ApiAuth.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly PasswordService _passwordService;
    private readonly TokenService _tokenService;

    public AuthController(
    AppDbContext context,
    PasswordService passwordService,
    TokenService tokenService)
    {
        _context = context;
        _passwordService = passwordService;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Registrar([FromBody] RegistroRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.nombre))
        {
            return BadRequest(new { detail = "El nombre es obligatorio." });
        }

        if (string.IsNullOrWhiteSpace(request.email))
        {
            return BadRequest(new { detail = "El correo es obligatorio." });
        }

        if (string.IsNullOrWhiteSpace(request.password))
        {
            return BadRequest(new { detail = "La contraseña es obligatoria." });
        }

        var email = request.email.Trim().ToLower();

        var existe = await _context.Usuarios
            .AnyAsync(u => u.email == email);

        if (existe)
        {
            return Conflict(new { detail = "El correo ya está registrado." });
        }

        var usuario = new Usuario
        {
            nombre = request.nombre.Trim(),
            email = email,
            telefono = request.telefono?.Trim() ?? string.Empty,
            password_hash = _passwordService.Hash(request.password),
            rol = "cliente",
            puntos = 0,
            solicita_mayorista = false,
            activo = true
        };

        _context.Usuarios.Add(usuario);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            id = usuario.id,
            nombre = usuario.nombre,
            email = usuario.email,
            telefono = usuario.telefono,
            rol = usuario.rol,
            puntos = usuario.puntos,
            solicita_mayorista = usuario.solicita_mayorista,
            activo = usuario.activo
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.email))
        {
            return BadRequest(new { detail = "El correo es obligatorio." });
        }

        if (string.IsNullOrWhiteSpace(request.password))
        {
            return BadRequest(new { detail = "La contraseña es obligatoria." });
        }

        var email = request.email.Trim().ToLower();

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.email == email);

        if (usuario == null)
        {
            return Unauthorized(new { detail = "Correo o contraseña incorrectos." });
        }

        if (!usuario.activo)
        {
            return Unauthorized(new { detail = "La cuenta está inactiva." });
        }

        var passwordCorrecta = _passwordService.Verify(
            request.password,
            usuario.password_hash
        );

        if (!passwordCorrecta)
        {
            return Unauthorized(new { detail = "Correo o contraseña incorrectos." });
        }

        var token = _tokenService.GenerarToken(usuario);

        return Ok(new
        {
            token,
            usuario = new
            {
                id = usuario.id,
                nombre = usuario.nombre,
                email = usuario.email,
                telefono = usuario.telefono,
                rol = usuario.rol,
                puntos = usuario.puntos,
                solicita_mayorista = usuario.solicita_mayorista,
                activo = usuario.activo
            }
        });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

        if (string.IsNullOrWhiteSpace(userIdClaim))
        {
            userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { detail = "Token inválido." });
        }

        var usuario = await _context.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.id == userId);

        if (usuario == null || !usuario.activo)
        {
            return Unauthorized(new { detail = "Usuario no encontrado." });
        }

        return Ok(new
        {
            id = usuario.id,
            nombre = usuario.nombre,
            email = usuario.email,
            telefono = usuario.telefono,
            rol = usuario.rol,
            puntos = usuario.puntos,
            solicita_mayorista = usuario.solicita_mayorista,
            activo = usuario.activo
        });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(new
        {
            mensaje = "Sesión cerrada correctamente."
        });
    }

    [Authorize]
    [HttpPost("me/solicitar-mayorista")]
    public async Task<IActionResult> SolicitarMayorista()
    {
        var userIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

        if (string.IsNullOrWhiteSpace(userIdClaim))
        {
            userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { detail = "Token inválido." });
        }

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.id == userId);

        if (usuario == null || !usuario.activo)
        {
            return NotFound(new { detail = "Usuario no encontrado." });
        }

        if (usuario.rol == "mayorista")
        {
            return BadRequest(new
            {
                detail = "El usuario ya tiene una cuenta mayorista."
            });
        }

        if (usuario.solicita_mayorista)
        {
            return BadRequest(new
            {
                detail = "La solicitud ya está en revisión."
            });
        }

        usuario.solicita_mayorista = true;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensaje = "Solicitud de cuenta mayorista enviada.",
            solicita_mayorista = usuario.solicita_mayorista
        });
    }

    [Authorize(Roles = "admin")]
    [HttpGet("usuarios")]
    public async Task<IActionResult> ListarUsuarios()
    {
        var usuarios = await _context.Usuarios
            .AsNoTracking()
            .OrderBy(u => u.id)
            .Select(u => new
            {
                id = u.id,
                nombre = u.nombre,
                email = u.email,
                telefono = u.telefono,
                rol = u.rol,
                puntos = u.puntos,
                solicita_mayorista = u.solicita_mayorista,
                activo = u.activo
            })
            .ToListAsync();

        return Ok(new
        {
            total = usuarios.Count,
            data = usuarios
        });
    }

    [Authorize(Roles = "admin")]
    [HttpPatch("usuarios/{id}")]
    public async Task<IActionResult> CambiarRol(int id, [FromBody] CambiarRolRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.rol))
            return BadRequest(new { detail = "El rol es obligatorio." });

        var rolesPermitidos = new[] { "cliente", "mayorista", "admin" };

        if (!rolesPermitidos.Contains(request.rol.ToLower()))
            return BadRequest(new { detail = "El rol no es válido." });

        var usuario = await _context.Usuarios.FindAsync(id);

        if (usuario == null)
            return NotFound(new { detail = "Usuario no encontrado." });

        usuario.rol = request.rol.ToLower();

        await _context.SaveChangesAsync();

        return Ok(new
        {
            id = usuario.id,
            nombre = usuario.nombre,
            email = usuario.email,
            telefono = usuario.telefono,
            rol = usuario.rol,
            puntos = usuario.puntos,
            solicita_mayorista = usuario.solicita_mayorista,
            activo = usuario.activo
        });
    }

}

public class RegistroRequest
{
    public string nombre { get; set; } = string.Empty;

    public string email { get; set; } = string.Empty;

    public string telefono { get; set; } = string.Empty;

    public string password { get; set; } = string.Empty;
}

public class LoginRequest
{
    public string email { get; set; } = string.Empty;
    public string password { get; set; } = string.Empty;
}

public class CambiarRolRequest
{
    public string rol { get; set; } = string.Empty;
}