// ✅ updateShopImageUrls.js
const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config()

const Shop = require('./models/Shop')

const imageMap = {
  '1.jpg': 'https://res.cloudinary.com/dtu6cmekj/image/upload/v1747124554/turtle-shop/ij9dsbl8oonkj6bub18w.jpg',
  '2.jpg': 'https://res.cloudinary.com/dtu6cmekj/image/upload/v1747124565/turtle-shop/eumi7msp7jvupf3azd0z.jpg',
  '3.jpg': 'https://res.cloudinary.com/dtu6cmekj/image/upload/v1747124566/turtle-shop/ull2banpkyy4sarqeddi.jpg',
  '4.jpg': 'https://res.cloudinary.com/dtu6cmekj/image/upload/v1747124567/turtle-shop/qwndpmp94y71fym7ctjh.jpg',
  '1746275648686.png': 'https://res.cloudinary.com/dtu6cmekj/image/upload/v1747124556/turtle-shop/izfa8f7fidykncggaskl.png',
  '1746276898021.jpg': 'https://res.cloudinary.com/dtu6cmekj/image/upload/v1747124557/turtle-shop/warb0ahwjwj2inbhmkyp.jpg',
  '1746519137399.jpg': 'https://res.cloudinary.com/dtu6cmekj/image/upload/v1747124558/turtle-shop/jfocgkxzyzd0gwpuhoty.jpg',
  '1746519181361.jpg': 'https://res.cloudinary.com/dtu6cmekj/image/upload/v1747124559/turtle-shop/qktm0ueha5dorl2hbent.jpg',
  '1746523174400.jpg': 'https://res.cloudinary.com/dtu6cmekj/image/upload/v1747124560/turtle-shop/kqdx99e28xs2hkn3xqsz.jpg',
  '1746524617106.jpg': 'https://res.cloudinary.com/dtu6cmekj/image/upload/v1747124561/turtle-shop/nkz7wysolwqttzqayiri.jpg',
  '1746617393385.jpg': 'https://res.cloudinary.com/dtu6cmekj/image/upload/v1747124562/turtle-shop/jwdswzwohiers9ai5n1g.jpg',
  '1746670513120.jpg': 'https://res.cloudinary.com/dtu6cmekj/image/upload/v1747124564/turtle-shop/leipbq0jf7mml51xzjli.jpg'
}

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('✅ 已連上資料庫，開始更新圖片網址...')

  const items = await Shop.find()
  let updated = 0

  for (const item of items) {
    const fileName = item.image?.split('/')?.pop()
    const newUrl = imageMap[fileName]
    if (newUrl && item.image !== newUrl) {
      item.image = newUrl
      await item.save()
      updated++
      console.log(`✅ 已更新 ${item.name} → ${newUrl}`)
    }
  }

  console.log(`🎉 全部更新完成，共 ${updated} 筆`) 
  mongoose.disconnect()
}).catch(err => {
  console.error('❌ 更新失敗：', err)
})
