# Etapa 1: compilación
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY . .

RUN dotnet restore "ApiCatalogo.csproj"

RUN dotnet publish "ApiCatalogo.csproj" \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false


# Etapa 2: ejecución
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final

WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8002

ENTRYPOINT ["dotnet", "ApiCatalogo.dll"]