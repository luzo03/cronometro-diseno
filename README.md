# DesignTimer

Cronómetro flotante para diseñadores: mide cuánto tardas en cada trabajo y compáralo con lo que cobraste para saber tu **tarifa efectiva real** por hora.

## Características

- Ventana pequeña, **siempre encima**, arrastrable. No estorba mientras diseñas.
- **Indicador de color en vivo:** el cronómetro pasa de verde → amarillo → rojo conforme te acercas (o pasas) el tiempo que pagaba lo cobrado.
- Comparación automática: tiempo real, costo real, diferencia y tarifa efectiva por hora.
- Historial persistente de trabajos con totales y promedios por moneda.
- Monedas precargadas: MXN, USD, EUR, COP. Agrega las que quieras.
- Actualizaciones automáticas vía GitHub Releases.

## Desarrollo

```powershell
npm install
npm run dev
```

## Build local (sin publicar)

```powershell
npm run build:win
```

El instalador `.exe` queda en `dist/`.

## Publicar nueva versión

1. Edita `publicar-version.ps1` y pega tu Personal Access Token de GitHub (scope `repo`) en `$env:GH_TOKEN`.
2. Ejecuta:

```powershell
.\publicar-version.ps1
```

Esto:
- Sube la versión (`1.0.0 → 1.0.1`).
- Compila el instalador.
- Lo publica en `https://github.com/luzo03/cronometro-diseno/releases`.

La próxima vez que el diseñador abra DesignTimer, se descargará y mostrará un botón **"Reiniciar y actualizar"**.

## Paleta

- `#0A0A0B` negro base (fondo)
- `#17171B` negro elevado (cards, inputs)
- `#5EEAD4` verde menta (acentos, acciones)
- `#FAFAFA` blanco (texto)
