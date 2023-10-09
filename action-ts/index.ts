import Jimp from 'jimp'
import path from 'path'
import fs from 'fs/promises'
import { convert as svgToPng } from 'convert-svg-to-png'
import parseInputs from './parseInputs'

interface Context {
  token: string
  event: {
    issue: {
      body: string
    }
  }
}

void (async () => {
  const context = JSON.parse(process.env.GITHUB_CONTEXT as string) as Context

  const { body } = context.event.issue

  const inputs = parseInputs(body)
  console.log('Parsed inputs:', inputs)

  await fs.writeFile(process.env.GITHUB_OUTPUT as string, `boardName=${inputs.boardName}`, 'utf8')

  if (inputs.logo !== undefined) {
    console.log(`Parsed logo URL: ${inputs.logo}`)

    const r = await fetch(inputs.logo)
    const contentType = r.headers.get('Content-Type')

    const blob = await r.blob()
    const logoBuffer = Buffer.from(await blob.arrayBuffer())
    const maxSize = 250

    let scaledLogo: Jimp
    if (contentType === 'image/svg+xml') {
      console.log('Detected SVG logo. Creating a 250x250 PNG logo from the SVG logo')
      const pngBuffer = await svgToPng(logoBuffer, {
        width: maxSize,
        height: maxSize
      })
      scaledLogo = await Jimp.create(pngBuffer)
      // logo.write(path.join(__dirname, 'test.png'))
    } else {
      const logo = await Jimp.create(logoBuffer)
      console.log(`Original logo: ${logo.getWidth()}x${logo.getHeight()} (${logo.getExtension()})`)
      if (logo.getWidth() > maxSize || logo.getHeight() > maxSize) {
        console.log(`Resizing logo to a maximum of ${maxSize}x${maxSize}`)
        scaledLogo = logo.scaleToFit(maxSize, maxSize)
        console.log(`New logo size: ${scaledLogo.getWidth()}x${scaledLogo.getHeight()}`)
      } else {
        console.log(`Logo is within ${maxSize}x${maxSize}. Not resizing`)
        scaledLogo = logo
      }
    }

    console.log('Saving logo to Documentation/coreboot_logo.bmp in coreboot folder', path.join(__dirname, '../coreboot/Documentation/coreboot_logo.bmp'))
    await scaledLogo.writeAsync(path.join(__dirname, '../coreboot/Documentation/coreboot_logo.bmp'))
  } else {
    console.log('No custom logo inputted. Default logo will be used')
  }

  const configFile = path.join(__dirname, '../coreboot/.config')
  if (inputs.DISABLE_HECI1_AT_PRE_BOOT !== undefined) {
    console.log('Adding custom DISABLE_HECI1_AT_PRE_BOOT to .config')
    await fs.appendFile(configFile, `CONFIG_DISABLE_HECI1_AT_PRE_BOOT=${inputs.DISABLE_HECI1_AT_PRE_BOOT ? 'y' : 'n'}\n`, 'utf8')
  } else {
    console.log('Not changing DISABLE_HECI1_AT_PRE_BOOT')
  }
})()