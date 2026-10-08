using ApiAuth.Models;
using Microsoft.EntityFrameworkCore;

namespace ApiAuth.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Usuario> Usuarios { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>(entity =>
        {
            // Tabla
            entity.ToTable("usuarios");

            // Llave primaria
            entity.HasKey(u => u.id);

            entity.Property(u => u.id)
                .ValueGeneratedOnAdd();

            // Datos personales
            entity.Property(u => u.nombre)
                .IsRequired();

            entity.Property(u => u.email)
                .IsRequired();

            entity.HasIndex(u => u.email)
                .IsUnique();

            entity.Property(u => u.telefono)
                .IsRequired();

            // Seguridad
            entity.Property(u => u.password_hash)
                .IsRequired();

            // Rol
            entity.Property(u => u.rol)
                .HasDefaultValue("cliente")
                .IsRequired();

            // Puntos
            entity.Property(u => u.puntos)
                .HasDefaultValue(0)
                .IsRequired();

            // Solicitud de cuenta mayorista
            entity.Property(u => u.solicita_mayorista)
                .HasDefaultValue(false)
                .IsRequired();

            // Estado de la cuenta
            entity.Property(u => u.activo)
                .HasDefaultValue(true)
                .IsRequired();
        });
    }
}