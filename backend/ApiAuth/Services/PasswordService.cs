using ApiAuth.Models;
using Microsoft.AspNetCore.Identity;

namespace ApiAuth.Services;

public class PasswordService
{
    private readonly PasswordHasher<Usuario> _hasher = new();

    public string Hash(string password)
    {
        var usuario = new Usuario();

        return _hasher.HashPassword(usuario, password);
    }

    public bool Verify(string password, string passwordHash)
    {
        var usuario = new Usuario();

        var resultado = _hasher.VerifyHashedPassword(
            usuario,
            passwordHash,
            password
        );

        return resultado == PasswordVerificationResult.Success ||
               resultado == PasswordVerificationResult.SuccessRehashNeeded;
    }
}
