// pages/vice/vice.js
var QQMapWX = require('./qqmap-wx-jssdk.min.js');
var qqmapsdk,timeout;
const app = getApp();
var page;
const recorderManager = wx.getRecorderManager()
recorderManager.onStart(() => {
  console.log('recorder start')
})
recorderManager.onStop((res) => {
  console.log('recorder stop', res)
  const { tempFilePath } = res
  wx.playVoice({
    filePath: tempFilePath,
  })
  wx.showLoading({
    title: '等待识别',
  })
  wx.uploadFile({
    url: app.d.hostUrl + '/Api/Index/wxupload', //仅为示例，非真实的接口地址
    filePath: tempFilePath,
    name: 'viceo',
    success: function (res) {
      console.log(res);
      wx.hideLoading();
      if (res.data == "") {
        wx.showToast({
          title: '结果为空！',
        })
        return;
      }
      var data = JSON.parse(res.data)
      //do something
      if (data.code == "00000") {
        wx.showModal({
          title: '提示',
          content: data.data.text
        })
        // qqmapsdk.search({
        //   keyword: data.data.text,
        //   success: function (res) {
        //     console.log(res);
        //   }
        // })
        page.search(data.data.text);
      } else {
        wx.showToast({
          title: data.desc
        })
      }
      console.log(data)
    }
  })
})

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 实例化API核心类
    mapkey: "AJ3BZ-EPVCQ-NEY5U-G5H5V-2THSH-XFFI4",
    curcity: "天津",
    text:"按住我",
    showcontext:false,
    press:false,
    index:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    page = that;
    qqmapsdk = new QQMapWX({
      key: this.data.mapkey
    })
    if (!this.data.curcity || !this.data.latitude || !this.data.longitude) {
      wx.getLocation({
        success: function (res1) {
          that.setCur(res1);
        },
      })
    }
    //请求热门搜索和历史记录
    //回调延迟 ，有时为空
    console.log(app)
    var uid = app.d.userId || 4;
    wx.request({
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      url: app.d.hostUrl + '/Api/Index/index',
      method: "post",
      data: {
        uid: uid
      },
      success:function( res ){
        if (res.statusCode == 200){
          var keyhis = res.data.data;
          that.setData({
            keyhis: keyhis[0],
            keyre: keyhis[1]
          })
          console.log(res.data);
  
        }
      }
    })
  },
  histap:function(e){
    var val = e.currentTarget.dataset.keyword;
    if (val && val != "") {
      this.search(val);
    }
  },
  removehis:function(e){
    var val = e.currentTarget.dataset.keyword;
    var index = e.currentTarget.dataset.index;
    var uid = app.d.userId || 4;
    if (val && val != "") {
      wx.request({
        header: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        url: app.d.hostUrl + '/Api/Index/removehis',
        method: "post",
        data: {
          uid: uid,
          keyword: val
        },
        success: function (res) {
          if (res.statusCode == 200) {
            var data = res.data;
            wx.showToast({
              title: data.message,
            })
            var keyhis = this.data.keyhis;
            keyhis.splice(index,1);
            this.setData({
              keyhis: keyhis
            })
            console.log(res.data);
          }
        }.bind(this)
      })
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },
  inputblur: function(){
    this.setData({
      showcontext:false
    })
  },
  inputfocus:function(){
    if (this.data.keywos && this.data.keywos.length>0){
      this.setData({
        showcontext: true
      })
    }
  },
  /**
   * callinput
   * 输入即时响应
  */
  callinput: function (e) {
    var val = e.detail.value;
    clearTimeout(timeout);
    timeout = setTimeout(function(){
      this.getKeywords(val);
    }.bind(this),500);
  },
  /**
   * 关键词提醒
   * **/
  getKeywords:function(val){
     var that = this;
     if (!val){
       that.setData({
         keywos: [],
         showcontext: false
       })
       return;
     }
     qqmapsdk.search({
       keyword: val,
       location: {
         latitude: this.data.latitude,
         longitude: this.data.longitude
       },
       address_format: 'short',
       success: function (res) {
         console.log("搜索结果", res);
         //此处 关键词 提示 索引
         if(res.status == 0 && res.count >0){
           that.setData({
             keywos:res.data,
             showcontext:true
           })
         }
       }
     })
   },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  startHandel: function () {
    console.log("开始")
    this.setData({
      text:"录音中"
    })
    recorderManager.start()
  },
  //确认搜索关键词
  keyconfirm:function(e){
    var val = e.detail.value;
    if(val && val != ""){
      this.search(val);
    }
  },
  //getData  获取自动补全对应的数据
  getData:function(e){
    console.log(e);
    var index = e.currentTarget.dataset.index;
    this.setData({
      index:index
    })
    var keywos = this.data.keywos;
    if (keywos[index]){
      var loc = keywos[index];
      wx.openLocation({
        name: loc['title'],
        address: loc['address'],
        latitude: loc.location.lat,
        longitude: loc.location.lng
      })
    }
  },
  endHandle: function () {
    console.log("结束")
    //结束录音  
    this.setData({
      text: "按住我"
    })
    recorderManager.stop()
  },
  chosecueloc:function(){
    //修改当前定位位置
    var that = this;
    wx.chooseLocation({
      success: function(res) {
        console.log("当前选择位置",res)
        that.setCur(res);
      }
    })
  },
  setCur: function (res1){
  //设置中心位置
    var that = this;
    qqmapsdk.reverseGeocoder({
      get_poi: 1,
      location: {
        latitude: res1.latitude,
        longitude: res1.longitude
      },
      success: function (res) {
        if (res.status == 0) {
          var curcity = res.result.address_component.district || res.result.address_component.city;
          wx.setStorage({
            key: 'curloc',
            data: res1,
          })
          that.setData({
            curcity: curcity,
            latitude: res1.latitude,
            longitude: res1.longitude
          })
        }
      }
    })
  },
  search:function(keyword){
    var uid = app.d.userId;
    var latitude = this.data.latitude;
    var longitude = this.data.longitude;
    wx.showLoading({
      title: '搜索中',
    })
    wx.request({
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      url: app.d.hostUrl + '/Api/Index/search',
      method: "post",
      data: {
        uid: uid,
        keyword: keyword,
        latitude: latitude,
        longitude: longitude
      },
      success:function( res1 ){
        var res = res1.data;
        if(res.status == 0 && res.count > 0){
          wx.setStorageSync("markers", res.data);
          wx.navigateTo({
            url: '/pages/map/map'
          })
        }else{
          wx.showModal({
            title: '提示',
            content: '2公里内无搜索结果！'
          })
        }
        console.log("接口数据", res1.data )
      },
      complete:function(){
        wx.hideLoading();
      }
    })
  }
})