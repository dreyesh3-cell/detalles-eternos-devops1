using ApiPedidos.Models;
using Microsoft.EntityFrameworkCore;

namespace ApiPedidos.Data;

public class CatalogoDbContext : DbContext
{
    public CatalogoDbContext(DbContextOptions<CatalogoDbContext> options)
        : base(options)
    {
    }

    public DbSet<ProductoCatalogo> Productos { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProductoCatalogo>()
            .ToTable("productos");

        modelBuilder.Entity<ProductoCatalogo>()
            .HasKey(p => p.id);

        modelBuilder.Entity<ProductoCatalogo>()
            .Property(p => p.precio)
            .HasPrecision(12, 2);

        modelBuilder.Entity<ProductoCatalogo>()
            .Property(p => p.precio_mayorista)
            .HasPrecision(12, 2);

        modelBuilder.Entity<ProductoCatalogo>()
            .Property(p => p.peso_lb)
            .HasPrecision(10, 2);
    }
}