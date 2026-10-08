using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ApiAuth.Models;
using Microsoft.IdentityModel.Tokens;

namespace ApiAuth.Services;

public class TokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerarToken(Usuario usuario)
    {
        var clave = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("No se configuró Jwt:Key.");

        var issuer = _configuration["Jwt:Issuer"]
            ?? "ApiAuth";

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, usuario.email),
            new Claim(ClaimTypes.Name, usuario.nombre),
            new Claim(ClaimTypes.Role, usuario.rol)
        };

        var securityKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(clave)
        );

        var credentials = new SigningCredentials(
            securityKey,
            SecurityAlgorithms.HmacSha256
        );

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: issuer,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}