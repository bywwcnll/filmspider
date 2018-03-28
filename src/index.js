import {getUrl, fetch, handleList, handleDetail} from './util'


(async () => {
  
  let listHtml = await fetch(getUrl(1))
  // console.log(res)
  
  let listJson = handleList(listHtml)
  // console.log(listJson)
  
  let fetchDetailArray = listJson.map(list=>{
    return fetch(list.href)
      .then(res=>{
        return handleDetail(res)
      })
  })
  let results = await Promise.all(fetchDetailArray)
  // console.log(results)
  
  
  
  
})()
