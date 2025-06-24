// 上传文件到Cloudflare R2
router.post('/upload-to-r2', async (ctx) => {
  try {
    const { files } = ctx.request;
    
    if (!files || !files.file) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: '没有找到上传的文件'
      };
      return;
    }
    
    const file = files.file;    
    const uploadParams = {
      Bucket: 'hauty',
      Key: file.originalFilename || file.name,
      Body: file.buffer || require('fs').readFileSync(file.filepath),
      ContentType: file.mimetype || file.type,
    };
    
    const result = await s3.upload(uploadParams).promise();
    
    ctx.body = {
      success: true,
      url: result.Location,
      key: result.Key
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: error.message
    };
  }
});