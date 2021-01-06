使用方法： 

​	将js文件拷贝到小程序目录中

   wxml2canvas(wrapperId, drawClassName, canvasId, this).then(() => {})通过此方式调用

   wrapperId：最外层<view>的ID名称

  drawClassName：需要绘制元素的class

  canvasId：需要绘制到上面的canvasId

  this：是改变当前this指向，传this即可