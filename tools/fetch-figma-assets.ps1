# 从 Figma MCP 返回的导出地址下载首页资产。
# 地址 7 天过期，下载后即落盘到 miniprogram/assets 下。

$ErrorActionPreference = 'Stop'
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$root = Join-Path $PSScriptRoot '..'
$assets = Join-Path $root 'miniprogram\assets'
$raw = Join-Path $PSScriptRoot '.figma\raw'

foreach ($dir in @($raw, "$assets\icons\home", "$assets\icons\tabbar", "$assets\images", "$assets\svg")) {
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

$downloads = @(
  @{ name = 'home-player-ranking.png';  url = 'https://www.figma.com/api/mcp/asset/06365dba-0753-4339-8447-21461d7339e7.png' }
  @{ name = 'home-event-calendar.png';  url = 'https://www.figma.com/api/mcp/asset/ac79528d-a211-49d1-a395-51c4193583d7.png' }
  @{ name = 'home-point-exchange.png';  url = 'https://www.figma.com/api/mcp/asset/87d586c3-69a6-489e-9ee8-63c13e195ada.png' }
  @{ name = 'home-past-champions.png';  url = 'https://www.figma.com/api/mcp/asset/2992a1e6-93c5-4d5f-829d-1739ecc5c31d.png' }
  @{ name = 'home-event-photos.png';    url = 'https://www.figma.com/api/mcp/asset/6a3a2e48-dd10-4488-baf0-50666266eeaf.png' }
  @{ name = 'home-annual-ceremony.png'; url = 'https://www.figma.com/api/mcp/asset/25c96f65-b201-4c26-a0ba-10602ae59b9a.png' }
  @{ name = 'home-my-registrations.png';url = 'https://www.figma.com/api/mcp/asset/ea8d7684-3af5-46ce-9920-c20926465321.png' }
  @{ name = 'court-photo.png';          url = 'https://www.figma.com/api/mcp/asset/faf53e4f-2b88-4fc8-847f-487c61c078b6.png' }
  @{ name = 'tab-super-cup.png';        url = 'https://www.figma.com/api/mcp/asset/27135f86-1ae3-419d-8396-72a5c7418da4.png' }
  @{ name = 'tab-profile.png';          url = 'https://www.figma.com/api/mcp/asset/590697b1-19ac-4315-b08c-044746efd789.png' }
  @{ name = 'wave-home.svg';            url = 'https://www.figma.com/api/mcp/asset/5098bee0-849c-40b3-9813-082c4371cb4d.svg' }
  @{ name = 'carousel-dots.svg';        url = 'https://www.figma.com/api/mcp/asset/7180160c-fe81-4ba0-93cf-0e4ee0e577ca.svg' }
  @{ name = 'icon-location.svg';        url = 'https://www.figma.com/api/mcp/asset/b9ca2bcb-413c-44d2-bf35-ab10e4bfdbd0.svg' }
  @{ name = 'icon-time.svg';            url = 'https://www.figma.com/api/mcp/asset/d9b5a3a0-318d-4e12-8f70-4b2a5f675d45.svg' }
  @{ name = 'icon-participants.svg';    url = 'https://www.figma.com/api/mcp/asset/1ebcdf2a-12e6-4ae1-907e-e4fb307b7034.svg' }
  @{ name = 'nav-selected-bg.svg';      url = 'https://www.figma.com/api/mcp/asset/9d92be46-2059-48c7-9b92-6aa78579fde0.svg' }
)

foreach ($item in $downloads) {
  $out = Join-Path $raw $item.name
  curl.exe -L -s -o $out $item.url
  $size = (Get-Item $out).Length
  Write-Host ("{0,-30} {1,10:N0} bytes" -f $item.name, $size)
}

Write-Host "`n下载目录: $raw"
