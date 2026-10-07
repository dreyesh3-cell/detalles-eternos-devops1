using ApiPagos.Models;
using Microsoft.EntityFrameworkCore;

namespace ApiPagos.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Pago> Pagos { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Pago>()
            .ToTable("pagos");

        modelBuilder.Entity<Pago>()
            .HasKey(p => p.id);

        modelBuilder.Entity<Pago>()
            .Property(p => p.monto)
            .HasColumnType("numeric(12,2)");

        modelBuilder.Entity<Pago>()
            .Property(p => p.estado)
            .HasMaxLength(20);

        modelBuilder.Entity<Pago>()
            .Property(p => p.metodo_pago)
            .HasMaxLength(30);

        modelBuilder.Entity<Pago>()
            .Property(p => p.banco)
            .HasMaxLength(100);

        modelBuilder.Entity<Pago>()
            .Property(p => p.referencia)
            .HasMaxLength(100);
    }
}