using ApiPedidos.Models;
using Microsoft.EntityFrameworkCore;

namespace ApiPedidos.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    // Base de datos de pedidos
    public DbSet<Pedido> Pedidos { get; set; }
    public DbSet<PedidoItem> PedidoItems { get; set; }
    public DbSet<PedidoHistorial> PedidoHistorial { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Pedido>().ToTable("pedidos");
        modelBuilder.Entity<PedidoItem>().ToTable("pedido_items");
        modelBuilder.Entity<PedidoHistorial>().ToTable("pedido_historial");

        modelBuilder.Entity<Pedido>().HasKey(p => p.id);
        modelBuilder.Entity<PedidoItem>().HasKey(i => i.id);
        modelBuilder.Entity<PedidoHistorial>().HasKey(h => h.id);

        modelBuilder.Entity<Pedido>()
            .HasMany(p => p.items)
            .WithOne(i => i.pedido)
            .HasForeignKey(i => i.pedido_id)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Pedido>()
            .HasMany(p => p.historial)
            .WithOne(h => h.pedido)
            .HasForeignKey(h => h.pedido_id)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PedidoItem>()
            .Property(i => i.precio_unitario)
            .HasPrecision(12, 2);

        modelBuilder.Entity<PedidoItem>()
            .Property(i => i.subtotal)
            .HasPrecision(12, 2);

        modelBuilder.Entity<Pedido>()
            .Property(p => p.subtotal)
            .HasPrecision(12, 2);

        modelBuilder.Entity<Pedido>()
            .Property(p => p.envio)
            .HasPrecision(12, 2);

        modelBuilder.Entity<Pedido>()
            .Property(p => p.cargo_empaque)
            .HasPrecision(12, 2);

        modelBuilder.Entity<Pedido>()
            .Property(p => p.total)
            .HasPrecision(12, 2);

        modelBuilder.Entity<Pedido>()
            .Property(p => p.peso_lb)
            .HasPrecision(10, 2);
    }
}