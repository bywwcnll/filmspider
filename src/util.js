import http from 'http'
import BufferHelper from 'bufferhelper'
import iconv from 'iconv-lite'
import cheerio from 'cheerio'

const host = 'http://www.xlp2.com'
export const getUrl = (index = 1, category = 1) => {
  return `${host}/category/${category}_${index}.htm`
}


export const handleList = html => {
  let $ = cheerio.load(html)
  let json = []
  $('.line_category').each((index, item) => {
    if (index % 2 == 0) {
      json[index / 2] = {}
      let a = $(item).find('a').eq(0)
      let name = $(a).text()
      name = name.substring(name.indexOf(' ') + 1, name.length)
      json[index / 2].name = name
      json[index / 2].href = host + $(a).attr('href')
    } else {
      json[(index - 1) / 2].date = $(item).text()
    }
  })
  return json
}

export const handleDetail = html => {
  let $ = cheerio.load(html.replace(/\r|\n|◎/g, ''))
  let plist = $('div[style="float:left;overflow:hidden;padding-bottom:15px;"] > p')
  let ptext = ''
  let propArr = []
  let desArr = []
  let ymIndex = 0
  for (let i = 0; i < plist.length; i++) {
    ptext = $(plist[i]).text()
    if (ptext.indexOf('译　　名') > -1) {
      ymIndex = i
      if (ptext.indexOf('下载地址') > -1) {
        ptext = ptext.substring(0, ptext.indexOf('下载地址'))
      }
      if (typeof(ptext) != 'undefined' || ptext != null) {
        propArr = dealProp(ptext)
      }
    }
    if (ymIndex != i && ptext.indexOf('简　　介') > -1) {
      if (i < plist.length - 1) {
        desArr = dealDescribe($, i + 1)
      } else if (i == plist.length - 1) {
        desArr = dealDescribe($, i)
      }
    }
  }
  let allprop = propArr.concat(desArr)
  if (allprop.length > 0) {
    allprop = allprop.concat(dealDownload($))
    let returnObj = translateObj(allprop)
    let imgs = $('div[style="float:left;overflow:hidden;padding-bottom:15px;"] img')
    if (imgs.length > 0) {
      let img = $(imgs[0]).attr('src')
      if (typeof(img) != 'undefined' && img != null && img.length > 0) {
        returnObj.img = img
      }
    }
    return returnObj
  }
}


export const fetch = (url, encoding = 'gbk') => {
  return new Promise((resolve, reject) => {
    if (!url) reject(null)
    http.get(url, res => {
      let bufferhelper = new BufferHelper()
      res.on('data', chunk => {
        bufferhelper.concat(chunk)
      })
      res.on('end', () => {
        resolve(iconv.decode(bufferhelper.toBuffer(), encoding))
      })
    }).on('error', (e) => {
      reject(e)
    })
  })
}


const propArray = [
  {
    key: '译　　名',
    value: 'yiming'
  },
  {
    key: '片　　名',
    value: 'pianming'
  },
  {
    key: '年　　代',
    value: 'niandai'
  },
  {
    key: '国　　家',
    value: 'guojia'
  },
  {
    key: '类　　别',
    value: 'leibie'
  },
  {
    key: '语　　言',
    value: 'yuyan'
  },
  {
    key: '字　　幕',
    value: 'zimu'
  },
  {
    key: '上映日期',
    value: 'shangyingriqi'
  },
  {
    key: 'IMDb评分',
    value: 'IMDbpingfen'
  },
  {
    key: '评　　分',
    value: 'pingfen'
  },
  {
    key: '豆瓣评分',
    value: 'doubanpingfen'
  },
  {
    key: '文件格式',
    value: 'wenjiangeshi'
  },
  {
    key: '视频尺寸',
    value: 'shipinchicun'
  },
  {
    key: '文件大小',
    value: 'wenjiandaxiao'
  },
  {
    key: '片　　长',
    value: 'pianchang'
  },
  {
    key: '导　　演',
    value: 'daoyan'
  },
  {
    key: '主　　演',
    value: 'zhuyan'
  },
  {
    key: '简　　介',
    value: 'jianjie'
  },
  {
    key: '剧情简介',
    value: 'juqingjianjie'
  }
]

function dealProp(ptext) {
  // console.log(ptext)
  let array = []
  for (let i = 0; i < propArray.length; i++) {
    let index = ptext.indexOf(propArray[i].key)
    if (index > -1) {
      let cell = {}
      cell.index = index
      cell.name = propArray[i].key
      cell.value = propArray[i].value
      array.push(cell)
    }
  }
  let sortArray = array.sort(function (a, b) {
    return a.index - b.index
  })
  // console.log(sortArray)
  if (sortArray.length <= 1) return ''
  let result = []
  for (let i = 0; i <= sortArray.length; i++) {
    if (i == 0) {
      ptext = ptext.split(sortArray[i].name)[1]
    } else if (i > 0) {
      let cell = {}
      cell.key = sortArray[i - 1].value
      if (i < sortArray.length) {
        cell.value = ptext.split(sortArray[i].name)[0].replace(/　/, '')
        let splitArray = ptext.split(sortArray[i].name)
        if (splitArray.length > 1) {
          ptext = splitArray[splitArray.length - 1]
        } else {
          ptext = splitArray[1]
        }
      } else {
        cell.value = ptext.replace(/　/, '')
        ptext = ''
      }
      if (cell.value.indexOf(' ') == 0 || cell.value.indexOf('　') == 0)
        cell.value = cell.value.substring(1, cell.value.length)
      result.push(cell)
    }
  }
  return result
}

function dealDescribe($, pindex) {
  let array = []
  let ptext = $('div[style="float:left;overflow:hidden;padding-bottom:15px;"] > p').eq(pindex).text()
  if (ptext.indexOf('下载地址') > -1) {
    ptext = ptext.substring(0, ptext.indexOf('下载地址'))
  }
  array[0] = {}
  array[0].key = 'jianjie'
  array[0].value = ptext
  return array
}

function dealDownload($) {
  let result = []
  for (let i = 0; i < $('a[href]').length; i++) {
    let href = $('a[href]').eq(i).attr('href')
    if (href.indexOf('ed2k://') == 0) {
      let cell = {}
      cell.name = $('a[href]').eq(i).text()
      cell.href = href
      result.push(cell)
    } else if (href.indexOf('thunder://') == 0) {
      let cell = {}
      cell.name = $('a[href]').eq(i).text()
      cell.href = href
      result.push(cell)
    } else if (href.indexOf('ftp://') == 0) {
      let cell = {}
      cell.name = $('a[href]').eq(i).text()
      cell.href = href
      result.push(cell)
    }
  }
  console.log(result)
  return result
}

function translateObj(array) {
  let obj = {}
  let temp = []
  for (let i = 0; i < array.length; i++) {
    if (typeof(array[i].key) != 'undefined') {
      obj[array[i].key] = array[i].value
    }
    if (typeof(array[i].name) != 'undefined') {
      let cell = {}
      cell.name = array[i].name
      cell.href = array[i].href
      temp.push(cell)
    }
  }
  obj.downloads = temp
  return obj
}