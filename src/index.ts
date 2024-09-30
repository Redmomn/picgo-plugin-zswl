import { IPicGo, IReqOptions, IReqOptionsWithBodyResOnly, PicGo } from 'picgo'
import FormData from 'form-data'

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

export = (ctx: PicGo) => {
  const handleUpload = async (ctx: IPicGo): Promise<any> => {
    const opt: IReqOptionsWithBodyResOnly = {
      method: 'GET',
      url: 'https://zswl-bed-token.b23.buzz/bed.php',
      responseType: 'text'
    }
    const token = await ctx.request(opt)
    console.log(`token: ${token}`)
    const output = ctx.output
    for (const imgInfo of output) {
      const formdata = new FormData()
      formdata.append('file', imgInfo.buffer, imgInfo.fileName)
      const postOpt: IReqOptions = {
        data: formdata,
        method: 'POST',
        url: `https://course.e-ai-edu.com/api/files/upload?access_token=${token}`,
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

  const register = (): void => {
    ctx.helper.uploader.register('zswl', {
      handle: handleUpload
    })
  }
  return {
    uploader: 'zswl',
    // transformer: 'zswl',
    register
  }
}
