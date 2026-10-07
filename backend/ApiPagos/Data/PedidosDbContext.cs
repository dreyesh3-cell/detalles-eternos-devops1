using ApiPagos.Models;
using Microsoft.EntityFrameworkCore;

namespace ApiPagos.Data;

public class PedidosDbContext : DbContext
{
    public PedidosDbContext(DbContextOptions<PedidosDbContext> options)
        : base(options)
    {
    }

    public DbSet<Pedido> Pedidos { get; set; }
    public DbSet<PedidoHistorial> PedidoHistorial { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Pedido>()
            .ToTable("pedidos");

        modelBuilder.Entity<Pedido>()
            .HasKey(p => p.id);

        modelBuilder.Entity<PedidoHistorial>()
            .ToTable("pedido_historial");

        modelBuilder.Entity<PedidoHistorial>()
            .HasKey(h => h.id);

        // Relación Pedido -> PedidoHistorial
        modelBuilder.Entity<Pedido>()
            .HasMany(p => p.historial)
            .WithOne()
            .HasForeignKey(h => h.pedido_id)
            .HasPrincipalKey(p => p.id);
    }
}