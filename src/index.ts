import { IPicGo, IPluginConfig, IReqOptions, IReqOptionsWithBodyResOnly, PicGo } from 'picgo'
import FormData from 'form-data'
import { Config } from './config'

interface UploadResponse {
  id: string
  isDeleted: boolean
  type: string
  name: string
  url: string
  size: number
  category: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

const refreshToken = async (ctx: IPicGo): Promise<void> => {
  const opt: IReqOptionsWithBodyResOnly = {
    method: 'GET',
    url: ctx.getConfig('picgo-plugin-zswl.api'),
    responseType: 'text'
  }
  const token: string = await ctx.request(opt)
  const pluginConfig = ctx.getConfig<Config>('picgo-plugin-zswl')
  pluginConfig.token = token
  pluginConfig.expireTime = Date.now() + (2 * 60 * 60 * 1000)
  ctx.saveConfig({
    'picgo-plugin-zswl': pluginConfig
  })
}

const getToken = async (ctx: IPicGo): Promise<string> => {
  const config = ctx.getConfig<Config>('picgo-plugin-zswl')
  if (!config.expireTime || config.expireTime < Date.now()) {
    console.log('token expired, refresh token')
    await refreshToken(ctx)
  }
  return await ctx.getConfig('picgo-plugin-zswl.token')
}

export = (ctx: PicGo) => {
  const handleUpload = async (ctx: IPicGo): Promise<any> => {
    const token = await getToken(ctx)
    console.log(`token: ${token}`)
    const output = ctx.output
    for (const imgInfo of output) {
      const formdata = new FormData()
      formdata.append('file', imgInfo.buffer, imgInfo.fileName)
      const postOpt: IReqOptions = {
        data: formdata,
        method: 'POST',
        url: `https://course.e-ai-edu.com/api/files/upload?access_token=${token}`,
        proxy: false,
        responseType: 'json',
        resolveWithFullResponse: true
      }
      const info = await ctx.request<UploadResponse, IReqOptions>(postOpt)
      delete imgInfo.base64Image
      delete imgInfo.buffer
      imgInfo.imgUrl = info.data.url
      imgInfo.url = info.data.url
    }
    return ctx
  }

  const uploadConfig = (ctx: IPicGo): IPluginConfig[] => {
    return [{
      name: 'api',
      type: 'input',
      required: true,
      default: 'https://zswl-bed-token.b23.buzz/bed.php'
    }, {
      name: 'token',
      type: 'input',
      required: false
    }]
  }

  const register = (): void => {
    ctx.helper.uploader.register('zswl', {
      handle: handleUpload
    })
  }
  return {
    uploader: 'zswl',
    config: uploadConfig,
    register
  }
}
