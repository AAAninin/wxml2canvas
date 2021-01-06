/* eslint-disable */
const PROPERTIES = ['hover-class', 'hover-start-time', 'space', 'src']
const COMPUTED_STYLE = [
    'color',
    'font-size',
    'font-weight',
    'font-family',
    'backgroundColor',
    'background',
    'border',
    'border-radius',
    'box-sizing',
    'line-height',
    'text-decoration',
    'margin-bottom',
    'margin-top',
    'padding-top',
    'text-overflow',
    '-webkit-line-clamp',
]
const DEFAULT_BORDER = '0px none rgb(0, 0, 0)'
const DEFAULT_BORDER_RADIUS = '0px'

// default z-index??
const DEFAULT_RANK = {
    view: 0,
    image: 1,
    text: 2,
}

const drawWrapper = (context, data) => {
    const { backgroundColor, width, height } = data

    context.setFillStyle(backgroundColor)
    
    context.fillRect(0, 0, width, height)
}

let imageDateList = []
let reslutImageDate = []

// todo: do more for different language
const strLen = str => {
    let count = 0
    for (let i = 0, len = str.length; i < len; i++) {
        count += str.charCodeAt(i) < 256 ? 1 : 2
    }
    return Math.floor(count / 2)
}

const isMuitlpleLine = (data, text) => {
    const { 'font-size': letterWidth, width } = data
    const length = strLen(text)
    const rowlineLength = length * parseInt(letterWidth, 10)
    return rowlineLength > width
}

const drawMutipleLine = (context, data, text) => {
    const {
        'font-size': letterWidth,
        width,
        left,
        top,
        'line-height': lineHeightAttr,
        'padding-top': paddingTop,
        '-webkit-line-clamp': lineClamp,
        'text-overflow': textOverflow,
        height
    } = data
    const lineHieght = lineHeightAttr === 'normal' ? Math.round(1.2 * letterWidth) : lineHeightAttr
    const rowLetterCount = Math.floor(width / parseInt(letterWidth, 10))
    const length = strLen(text)

    let rowCount = Math.round(height / parseInt(lineHieght, 10))
    if (rowCount === 1) {
        const rowTop = top + parseInt(paddingTop, 10)
        context.fillText(text, left, rowTop)
    } else if (parseInt(lineClamp, 10) === 1 && textOverflow === 'ellipsis') {
        const rowTop = top + parseInt(paddingTop, 10)
        context.fillText(text.substring(0, rowLetterCount - 1) + '...', left, rowTop)
    } else {
        for (let i = 0; i < length; i += rowLetterCount) {
            const lineText = length === rowLetterCount ? text : text.substring(i, i + rowLetterCount)
            const rowNumber = Math.floor(i / rowLetterCount)
            const rowTop = top + (rowNumber * parseInt(lineHieght, 10)) + parseInt(paddingTop, 10)
            if (rowCount > 1) {
                context.fillText(lineText, left, rowTop)
            } else if (rowCount === 1) {
                context.fillText(Math.ceil(length / rowLetterCount) > 2 ? lineText.substring(0, lineText.length - 1) + '...' : lineText, left, rowTop)
            }
            rowCount = rowCount - 1
        }
    }
}

// enable color, font, for now only support chinese
const drawText = (context, data) => {
    context.save()
    context.setFillStyle('white')
    const {
        dataset: { text },
        left,
        top,
        color,
        'font-weight': fontWeight,
        'font-size': fontSize,
        'font-family': fontFamily,
        'margin-top': marginTop,
        'padding-top': paddingTop,
        'margin-bottom': marginBottom
    } = data
    const canvasText = Array.isArray(text) ? text[0] : text
    context.font = `${fontWeight > 500 ? 'bold' : fontWeight} ${Math.round(
        parseFloat(fontSize),
    )}px ${fontFamily}`
    context.setFillStyle(color)
    if (isMuitlpleLine(data, canvasText)) {
        drawMutipleLine(context, data, canvasText)
    } else {
        if (data['text-decoration'].indexOf('line-through') !== -1) {
            context.fillText(canvasText, left, top - parseInt(marginBottom, 10) + parseInt(paddingTop, 10))
            context.fillRect(left, top - parseInt(marginBottom, 10) + parseInt(paddingTop, 10) + (data.height / 2), data.width, 1)
        } else {
            context.fillText(canvasText, left, top - parseInt(marginBottom, 10) + parseInt(paddingTop, 10))
        }
    }
    context.font = ''
    context.setFillStyle('white')
    context.restore()
}

const getImgInfo = src =>
    new Promise((resolve, reject) => {
        wx.getImageInfo({
            src,
            success(res) {
                resolve(res)
            },
        })
    })

const hasBorder = border => border !== DEFAULT_BORDER
const hasBorderRadius = borderRadius => borderRadius !== DEFAULT_BORDER_RADIUS

const getBorderAttributes = border => {
    let borderColor, borderStyle
    let borderWidth = 0

    if (hasBorder) {
        borderWidth = parseInt(border.split(/\s/)[0], 10)
        borderStyle = border.split(/\s/)[1]
        borderColor = border.match(/(rgb).*/gi)[0]
    }
    return {
        borderWidth,
        borderStyle,
        borderColor,
    }
}

const getImgRect = (imgData, borderWidth) => {
    const { width, height, left, top } = imgData
    const imgWidth = width - 2 * borderWidth
    const imgHeight = height - 2 * borderWidth
    const imgLeft = left + borderWidth
    const imgTop = top + borderWidth
    return {
        imgWidth,
        imgHeight,
        imgLeft,
        imgTop,
    }
}

const getArcCenterPosition = imgData => {
    const { width, height, left, top } = imgData
    const coordX = width / 2 + left
    const coordY = height / 2 + top
    return {
        coordX,
        coordY,
    }
}

const getArcRadius = (imgData, borderWidth = 0) => {
    const { width } = imgData
    return width / 2 - borderWidth / 2
}

const getCalculatedImagePosition = (imgData, naturalWidth, naturalHeight) => {
    const { border } = imgData
    const { borderWidth } = getBorderAttributes(border)
    const { imgWidth, imgHeight, imgLeft, imgTop } = getImgRect(
        imgData,
        borderWidth,
    )
    const ratio = naturalWidth / naturalHeight
    // tweak for real width and position => center center
    const realWidth = ratio > 0 ? imgWidth : imgHeight * ratio
    const realHeight = ratio > 0 ? imgHeight : imgWidth * (1 / ratio)
    const offsetLeft = ratio > 0 ? 0 : (imgWidth - realWidth) / 2
    const offsetTop = ratio > 0 ? (imgHeight - realHeight) / 2 : 0
    return {
        realWidth,
        realHeight,
        left: imgLeft + offsetLeft,
        top: imgTop + offsetTop,
    }
}
const sameBorderRadius = (arr) => {
    let firstText = arr[0]
    let result = true
    arr.forEach(value => {
        if (value !== firstText) {
            result = false
        }
    })
    return result
}
const drawArcImage = (context, imgData, index) => {
    const { src } = imgData
    const { coordX, coordY } = getArcCenterPosition(imgData)
    // return getImgInfo(src).then(res => {
        let res = reslutImageDate[index]
        const { width: naturalWidth, height: naturalHeight } = res
        const { left, top } = imgData
        const arcRadius = getArcRadius(imgData)
        // 判断是全部圆角还是单独圆角
        let { 'border-radius': borderRadius } = imgData
        let borderRadiusArr = borderRadius.split(' ')
        const { realWidth, realHeight } = getCalculatedImagePosition(
            imgData,
            naturalWidth,
            naturalHeight,
        )
        drawArc(context, borderRadius, top, left, realWidth, realHeight)

        context.clip()
        context.drawImage(
            res.path,
            0,
            0,
            naturalWidth,
            naturalHeight,
            left,
            top,
            realWidth,
            realHeight,
        )
        context.restore()
    // })
}

const drawRectImage = (context, imgData, index) => {
    const { src, width, height, left, top } = imgData

    // return getImgInfo(src).then(res => {
        let res = reslutImageDate[index]
        const { width: naturalWidth, height: naturalHeight } = res
        context.save()
        context.beginPath()
        context.rect(left, top, width, height)
        context.closePath()
        context.clip()
        const {
            left: realLeft,
            top: realTop,
            realWidth,
            realHeight,
        } = getCalculatedImagePosition(imgData, naturalWidth, naturalHeight)
        context.drawImage(
            res.path,
            0,
            0,
            naturalWidth,
            naturalHeight,
            left,
            top,
            realWidth,
            realHeight,
        )
        context.restore()
    // })
}

const drawArcBorder = (context, imgData) => {
    const { border } = imgData
    const { coordX, coordY } = getArcCenterPosition(imgData)
    const { borderWidth, borderColor } = getBorderAttributes(border)
    const arcRadius = getArcRadius(imgData, borderWidth)
    context.save()
    context.beginPath()
    context.setLineWidth(borderWidth)
    context.setStrokeStyle(borderColor)
    context.arc(coordX, coordY, arcRadius, 0, 2 * Math.PI)
    context.stroke()
    context.restore()
}

const drawRectBorder = (context, imgData) => {
    const { border } = imgData
    const { left, top, width, height } = imgData
    const { borderWidth, borderColor } = getBorderAttributes(border)

    const correctedBorderWidth = borderWidth + 1 // draw may cause empty 0.5 space
    context.save()
    context.beginPath()
    context.setLineWidth(correctedBorderWidth)
    context.setStrokeStyle(borderColor)

    context.rect(
        left + borderWidth / 2,
        top + borderWidth / 2,
        width - borderWidth,
        height - borderWidth,
    )
    context.stroke()
    context.restore()
}

// image, enable border-radius: 50%, border, bgColor
const drawImage = (context, imgData, index) => {
    // 将画笔颜色转成白色
    context.setFillStyle('white')
    const { border, 'border-radius': borderRadius } = imgData
    if (hasBorderRadius(borderRadius)) {
        drawArcImage(context, imgData, index)
    } else {
        drawRectImage(context, imgData, index)
    }
    if (hasBorder(border)) {
        if (hasBorderRadius(borderRadius)) {
            return drawArcBorder(context, imgData)
        } else {
            return drawRectBorder(context, imgData)
        }
    }
}

// e.g. 10%, 4px
const getBorderRadius = imgData => {
    const { width, height, 'border-radius': borderRadiusAttr } = imgData
    const borderRadius = parseInt(borderRadiusAttr, 10)
    if (borderRadiusAttr.indexOf('%') !== -1) {
        const borderRadiusX = parseInt(borderRadius / 100 * width, 10)
        const borderRadiusY = parseInt(borderRadius / 100 * height, 10)
        return {
            isCircle: borderRadiusX === borderRadiusY,
            borderRadius: borderRadiusX,
            borderRadiusX,
            borderRadiusY,
        }
    } else {
        return {
            isCircle: true,
            borderRadius,
        }
    }
}

const drawArc = (context, borderRadius, top, left, width, height) => {
    let borderRadiusArr = borderRadius.split(' ')
    if (sameBorderRadius(borderRadiusArr)) {
        borderRadiusArr = [borderRadius, borderRadius, borderRadius, borderRadius]
    }
    
    let borderTopLeftRadius = borderRadiusArr[0].indexOf('%') !== -1 ? width * parseInt(borderRadiusArr[0].split('%')[0], 10) / 100 : parseInt(borderRadiusArr[0], 10)
    let borderTopRightRadius = borderRadiusArr[1].indexOf('%') !== -1 ? width * parseInt(borderRadiusArr[1].split('%')[0], 10) / 100 : parseInt(borderRadiusArr[1], 10)
    let borderBottomLeftRadius = borderRadiusArr[2].indexOf('%') !== -1 ? width * parseInt(borderRadiusArr[2].split('%')[0], 10) / 100 : parseInt(borderRadiusArr[2], 10)
    let borderBottomRightRadius = borderRadiusArr[3].indexOf('%') !== -1 ? width * parseInt(borderRadiusArr[3].split('%')[0], 10) / 100 : parseInt(borderRadiusArr[3], 10)

    // let point = []


    context.save()
    context.beginPath()
    context.setStrokeStyle('rgba(0, 0, 0, 0)')
    left = Math.trunc(left)
    top = Math.trunc(top)
    width = Math.trunc(width)
    height = Math.trunc(height)
    // context.fill()
    let p = { x: left + borderTopLeftRadius, y: top } //开始位置的zuobia
    let r = 10 //弧线的半径
    let num = 120//边长
    let topSideWidth = width - borderTopLeftRadius - borderTopRightRadius;
    let bottomSideWidth = width - borderBottomLeftRadius - borderBottomRightRadius;
    let leftSideHeight = height - borderTopLeftRadius - borderBottomLeftRadius;
    let rightSideHeight = height - borderTopRightRadius - borderBottomRightRadius;
    let right = left + width
    let bottom = top + height

    context.moveTo(p.x, p.y) //开始位置
    if (borderTopRightRadius) {
        context.arcTo(right, p.y, right, p.y + borderTopRightRadius, borderTopRightRadius)//第一个圆弧 右上
    } else {
        context.lineTo(right, p.y)
    }

    context.lineTo(right, bottom - borderBottomRightRadius)

    if (borderBottomRightRadius) {
        context.arcTo(right, bottom, right - borderBottomRightRadius, bottom, borderBottomRightRadius)//第一个圆弧 右下
    } else {
        context.lineTo(right, bottom)
    }

    context.lineTo(left + borderBottomLeftRadius, bottom)

    if (borderBottomLeftRadius) {
        context.arcTo(left, bottom, left, bottom - borderBottomLeftRadius, borderBottomLeftRadius)//第一个圆弧 左下
    } else {
        context.lineTo(left, bottom)
    }

    context.lineTo(left, p.y + borderTopLeftRadius)

    if (borderTopLeftRadius) {
        context.arcTo(left, p.y, p.x, p.y, borderTopLeftRadius)//第一个圆弧 左上
    } else {
        context.lineTo(left, p.y)
    }

    context.stroke()
    context.closePath()
}

const drawViewArcBorder = (context, imgData) => {
    
    const { width, height, left, top, backgroundColor, background, border } = imgData
    // const { borderRadius } = getBorderRadius(imgData)
    const { borderWidth, borderColor } = getBorderAttributes(border)

    let { 'border-radius': borderRadius } = imgData
    
    drawArc(context, borderRadius, top, left, width, height)

    
    if (backgroundColor) {
        context.setFillStyle(backgroundColor)
        context.fill()
    }
    if (borderColor && borderWidth) {
        context.setLineWidth(borderWidth)
        context.setStrokeStyle(borderColor)
        context.stroke()
    }
    if (background.indexOf('linear-gradient') !== -1) {
        context.setFillStyle('white')
        let firstColor = background.split('linear-gradient')[1].split(' repeat')[0].split('rgb(')[1].split(')')[0]
        let secondColor = background.split('linear-gradient')[1].split(' repeat')[0].split('rgb(')[2].split(')')[0]
        const grd = context.createLinearGradient(imgData.left, imgData.top, imgData.width + imgData.left, imgData.height + imgData.top)
        grd.addColorStop(0, `rgb(${firstColor})`)
        grd.addColorStop(1, `rgb(${secondColor})`)
        context.setFillStyle(grd)
        context.fill()
    }
    
}

const drawViewBezierBorder = (context, imgData) => {
    const { width, height, left, top, backgroundColor, background, border } = imgData
    const { borderWidth, borderColor } = getBorderAttributes(border)
    const { borderRadiusX, borderRadiusY } = getBorderRadius(imgData)
    context.beginPath()
    context.moveTo(left + borderRadiusX, top)
    context.lineTo(left + width - borderRadiusX, top)
    context.quadraticCurveTo(left + width, top, left + width, top + borderRadiusY)
    context.lineTo(left + width, top + height - borderRadiusY)
    context.quadraticCurveTo(
        left + width,
        top + height,
        left + width - borderRadiusX,
        top + height,
    )
    context.lineTo(left + borderRadiusX, top + height)
    context.quadraticCurveTo(
        left,
        top + height,
        left,
        top + height - borderRadiusY,
    )
    context.lineTo(left, top + borderRadiusY)
    context.quadraticCurveTo(left, top, left + borderRadiusX, top)
    context.closePath()
    if (backgroundColor) {
        context.setFillStyle(backgroundColor)
        context.fill()
        context.restore()
    }
    if (borderColor && borderWidth) {
        context.setLineWidth(borderWidth)
        context.setStrokeStyle(borderColor)
        context.stroke()
    }
    if (background.indexOf('linear-gradient') !== -1) {
        let firstColor = background.split('linear-gradient')[1].split(' repeat')[0].split('rgb(')[1].split(')')[0]
        let secondColor = background.split('linear-gradient')[1].split(' repeat')[0].split('rgb(')[2].split(')')[0]
        const grd = context.createLinearGradient(imgData.left, imgData.top, imgData.width, imgData.height)
        grd.addColorStop(0, `rgb(${firstColor})`)
        grd.addColorStop(1, `rgb(${secondColor})`)
        context.setFillStyle(grd)
        context.fill()
        context.restore()
    }
}

// enable border, border-radius, bgColor, position
const drawView = (context, imgData) => {
    const { isCircle } = getBorderRadius(imgData)
    if (isCircle) {
        drawViewArcBorder(context, imgData)
    } else {
        drawViewBezierBorder(context, imgData)
    }
}

const isTextElement = item => {
    const { dataset: { text }, type } = item
    return Boolean(text) || type === 'text'
}

const isImageElement = item => {
    const { src, type } = item
    return Boolean(src) || type === 'image'
}

const isViewElement = item => {
    const { type } = item
    return type === 'view'
}

const formatElementData = elements =>
    elements.map(element => {
        if (isTextElement(element)) {
            element.type = 'text'
            element.rank = DEFAULT_RANK.text
        } else if (isImageElement(element)) {
            element.type = 'image'
            element.rank = DEFAULT_RANK.image
        } else {
            element.type = 'view'
            element.rank = DEFAULT_RANK.view
        }
        return element
    })

// todo: use z-index as order to draw??
const getSortedElementsData = elements =>
    elements.sort((a, b) => {
        if (a.rank < b.rank) {
            return -1
        } else if (a.rank > b.rank) {
            return 1
        }
        return 0
    })

const drawElements = (context, storeItems) => {
    const itemPromise = []
    storeItems.forEach((item, index) => {
        if (isTextElement(item)) {
            const text = drawText(context, item)
            itemPromise.push(text)
        } else if (isImageElement(item)) {
            const image = drawImage(context, item, index)
            itemPromise.push(image)
        } else {
            const view = drawView(context, item)
            itemPromise.push(view)
        }
    })
    return itemPromise
}

// storeObject: { 0: [...], 1: [...] }
// chain call promise based on Object key
const drawElementBaseOnIndex = (context, storeObject, key = 0, drawPromise) => {
    if (typeof drawPromise === 'undefined') {
        drawPromise = Promise.resolve()
    }
    const objectKey = key // note: key is changing when execute promise then
    const chainPromise = drawPromise.then(() => {
        const nextPromise = storeObject[objectKey]
            ? Promise.all(drawElements(context, storeObject[objectKey]))
            : Promise.resolve()
        return nextPromise
    })

    if (key >= Object.keys(storeObject).length) {
        return chainPromise
    } else {
        return drawElementBaseOnIndex(context, storeObject, key + 1, chainPromise)
    }
}

const getImageRes = (index = 0, resolve) => {
    wx.getImageInfo({
        src: imageDateList[index].src,
        success: (res) => {
            reslutImageDate.push(res)

            if (index === imageDateList.length - 1) {
                resolve()
            } else {
                ++index
                getImageRes(index, resolve)
            }
        },
        fail: (err) => {
            console.log(err)
        }
    })
}

const drawCanvas = (canvasId, wrapperData, innerData, that) => {
    const context = wx.createCanvasContext(canvasId, that)
    context.setTextBaseline('top')

    drawWrapper(context, wrapperData[0])

    // todo: use this after weixin fix stupid clip can't work bug in fillRect
    // for now, just set canvas background as a compromise

    const storeObject = {}

    const sortedElementData = getSortedElementsData(formatElementData(innerData)) // fake z-index

    sortedElementData.forEach(item => {
        if (!storeObject[item.rank]) {
            // initialize
            storeObject[item.rank] = []
        }
        if (isTextElement(item) || isImageElement(item) || isViewElement(item)) {
            storeObject[item.rank].push(item)
        }
        if (isImageElement(item)) {
            imageDateList.push(item)
        }
    })
    // note: draw is async
    return new Promise((resolve, reject) => {
        new Promise((resolv, rej) => {
            getImageRes(0, resolv)
        }).then(res => {
            drawElementBaseOnIndex(context, storeObject).then(
                () =>
                    context.draw(false, setTimeout(() => {
                        resolve()
                    }, 300))
            )
        })
    })
}

const wxSelectorQuery = (element, that) =>
    new Promise((resolve, reject) => {
        try {
            wx
                .createSelectorQuery()
                .in(that)
                .selectAll(element)
                .fields(
                    {
                        dataset: true,
                        size: true,
                        rect: true,
                        node: true,
                        context: true,
                        properties: PROPERTIES,
                        computedStyle: COMPUTED_STYLE,
                    },
                    res => {
                        let changeRes = res
                        let scrollTop = 0
                        let left = 0
                        if (changeRes[0].top !== 0) {
                            scrollTop = changeRes[0].top
                            left = changeRes[0].left
                            changeRes.forEach((value, index) => {
                                changeRes[index].top = value.top - scrollTop
                                changeRes[index].left = value.left - left
                            })
                        }
                        resolve(changeRes)
                    },
                )
                .exec()
        } catch (error) {
            reject(error)
        }
    })

const wxml2canvas = (wrapperId, elementsClass, canvasId, that) => {
    reslutImageDate = []
    imageDateList = []
    const getWrapperElement = wxSelectorQuery(wrapperId, that)
    const getInnerElements = wxSelectorQuery(elementsClass, that)

    return Promise.all([getWrapperElement, getInnerElements]).then(data => {
        return drawCanvas(canvasId, data[0], data[1], that)
    })
}

// export default wxml2canvas
module.exports = wxml2canvas