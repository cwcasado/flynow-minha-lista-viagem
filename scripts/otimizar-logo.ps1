# Redimensiona a logo original (2,9 MB) para os tamanhos usados na interface.
# Uso: powershell -ExecutionPolicy Bypass -File scripts/otimizar-logo.ps1

Add-Type -AssemblyName System.Drawing

$raiz = Split-Path -Parent $PSScriptRoot
$origem = Join-Path $raiz "public\flynow-logo-transparente.png"

if (-not (Test-Path $origem)) {
  throw "Logo de origem não encontrada: $origem"
}

$imagem = [System.Drawing.Image]::FromFile($origem)
$lado = [Math]::Min($imagem.Width, $imagem.Height)

foreach ($tamanho in 88, 176) {
  $destino = Join-Path $raiz "public\flynow-logo-$tamanho.png"
  $bmp = New-Object System.Drawing.Bitmap $tamanho, $tamanho
  $g = [System.Drawing.Graphics]::FromImage($bmp)

  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)

  $offset = [int](($imagem.Width - $lado) / 2)
  $g.DrawImage(
    $imagem,
    (New-Object System.Drawing.Rectangle 0, 0, $tamanho, $tamanho),
    (New-Object System.Drawing.Rectangle $offset, 0, $lado, $lado),
    [System.Drawing.GraphicsUnit]::Pixel
  )

  $g.Dispose()
  $bmp.Save($destino, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()

  $kb = [Math]::Round((Get-Item $destino).Length / 1KB, 1)
  Write-Output "$destino ($kb KB)"
}

$imagem.Dispose()
