# Gera as versoes otimizadas da logo a partir do PNG grande.
# Uso: powershell -ExecutionPolicy Bypass -File scripts/otimizar-logo.ps1
#
# Regras (aprendidas na pratica):
# - Recortar o padding transparente antes de redimensionar. O arquivo original
#   tem 2752x1536, mas o desenho ocupa 2153x801; recortar um quadrado do centro
#   cortava as laterais da logo.
# - Manter a proporcao original: a logo e um lockup horizontal (globo + "FlyNow"
#   + "VIAGENS"), nunca quadrada.
# - Gerar uma variante para o tema noturno: no escuro o azul-marinho do texto fica
#   a 1,3:1 sobre o card, praticamente invisivel. A variante deixa os pixels frios
#   em creme (#e9e4db) e preserva o ambar da palavra "now".

param(
  [string]$Origem = "",
  [string]$Destino = ""
)

Add-Type -AssemblyName System.Drawing

$raiz = Split-Path -Parent $PSScriptRoot
if (-not $Origem) { $Origem = Join-Path $raiz "public\flynow-logo-transparente.png" }
if (-not $Destino) { $Destino = Join-Path $raiz "public" }

if (-not (Test-Path $Origem)) {
  throw "Logo de origem nao encontrada: $Origem"
}

function Salvar-Png($bitmap, $caminho) {
  $bitmap.Save($caminho, [System.Drawing.Imaging.ImageFormat]::Png)
  $kb = [Math]::Round((Get-Item $caminho).Length / 1KB, 1)
  Write-Output ("{0} ({1}x{2}, {3} KB)" -f (Split-Path $caminho -Leaf), $bitmap.Width, $bitmap.Height, $kb)
}

function Desenhar-Redimensionado($origem, $recorte, $largura, $altura) {
  $bmp = New-Object System.Drawing.Bitmap $largura, $altura
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $g.Clear([System.Drawing.Color]::Transparent)
  $destinoRect = New-Object System.Drawing.Rectangle 0, 0, $largura, $altura
  $g.DrawImage($origem, $destinoRect, $recorte, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()
  return $bmp
}

$imagem = [System.Drawing.Bitmap]::FromFile($Origem)

# 1. Area realmente ocupada (alfa > 12), com passo 4 px.
$minX = $imagem.Width; $minY = $imagem.Height; $maxX = 0; $maxY = 0
for ($y = 0; $y -lt $imagem.Height; $y += 4) {
  for ($x = 0; $x -lt $imagem.Width; $x += 4) {
    if ($imagem.GetPixel($x, $y).A -gt 12) {
      if ($x -lt $minX) { $minX = $x }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
}

if ($maxX -le $minX -or $maxY -le $minY) {
  throw "A imagem de origem parece vazia (sem pixels opacos)."
}

$recorte = New-Object System.Drawing.Rectangle $minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1)
Write-Output ("Conteudo: {0}x{1} (de {2}x{3})" -f $recorte.Width, $recorte.Height, $imagem.Width, $imagem.Height)

# 2. Variantes do tema claro, preservando a proporcao.
foreach ($largura in 88, 176) {
  $altura = [int][Math]::Round($recorte.Height * $largura / $recorte.Width)
  $bmp = Desenhar-Redimensionado $imagem $recorte $largura $altura
  Salvar-Png $bmp (Join-Path $Destino "flynow-logo-$largura.png")
  $bmp.Dispose()
}

# 3. Variante do tema noturno: pixels frios viram creme, ambar e preservado.
$creme = [System.Drawing.Color]::FromArgb(255, 233, 228, 219)
$escuro = Desenhar-Redimensionado $imagem $recorte 176 ([int][Math]::Round($recorte.Height * 176 / $recorte.Width))

for ($y = 0; $y -lt $escuro.Height; $y++) {
  for ($x = 0; $x -lt $escuro.Width; $x++) {
    $p = $escuro.GetPixel($x, $y)
    if ($p.A -le 12) { continue }

    # Ambar/laranja (fundo do "now" e do aviao) mantem a cor original.
    $quente = ($p.R -gt 140) -and ($p.R -gt ($p.B + 40))
    if ($quente) { continue }

    $novo = [System.Drawing.Color]::FromArgb($p.A, $creme.R, $creme.G, $creme.B)
    $escuro.SetPixel($x, $y, $novo)
  }
}

Salvar-Png $escuro (Join-Path $Destino "flynow-logo-escuro-176.png")

$alturaMenor = [int][Math]::Round($escuro.Height * 88 / $escuro.Width, [System.MidpointRounding]::AwayFromZero)
$menor = [System.Drawing.Bitmap]::new(88, $alturaMenor)
$g = [System.Drawing.Graphics]::FromImage($menor)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$g.DrawImage($escuro, 0, 0, $menor.Width, $menor.Height)
$g.Dispose()
Salvar-Png $menor (Join-Path $Destino "flynow-logo-escuro-88.png")

$menor.Dispose()
$escuro.Dispose()
$imagem.Dispose()
