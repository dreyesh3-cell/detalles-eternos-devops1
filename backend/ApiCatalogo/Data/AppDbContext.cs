using ApiCatalogo.Models;
using Microsoft.EntityFrameworkCore;

namespace ApiCatalogo.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Producto> Productos { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Producto>()
            .ToTable("productos");

        modelBuilder.Entity<Producto>()
            .HasKey(p => p.id);

        modelBuilder.Entity<Producto>()
            .Property(p => p.id)
            .ValueGeneratedOnAdd();

        modelBuilder.Entity<Producto>()
            .Property(p => p.activo)
            .HasDefaultValue(true);
    }
}