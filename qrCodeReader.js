class QrCodeReader {
    constructor(image, width, height) {
        this.image = image;
        this.imageGreyScale = image;
        this.width = width;
        this.height = height;
        this.imgPixels = null;
        this.bitMap = null;
    }
    grayScale() {
        let imgPixels = this.image;
        let width = this.width;
        let height = this.height;
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var i = (y * 4) * width + x * 4;
                var avg = (imgPixels.data[i] + imgPixels.data[i + 1] + imgPixels.data[i + 2]) / 3;
                imgPixels.data[i] = avg;
                imgPixels.data[i + 1] = avg;
                imgPixels.data[i + 2] = avg;
            }
        }
        this.imgPixels = imgPixels;
        this.imageGreyScale = imgPixels;
        return imgPixels;
    }
    getBrightness(image) {
        let precisionZone = 4;
        let zoneWidth = Math.floor(this.width / precisionZone);
        let zoneHeight = Math.floor(this.height / precisionZone);
        let minmax = new Array(precisionZone);
        for (let i = 0; i < precisionZone; i++) {
            minmax[i] = new Array(precisionZone);
            for (let i2 = 0; i2 < precisionZone; i2++) {
                minmax[i][i2] = new Array(0, 0);
            }
        }
        for (let zoney = 0; zoney < precisionZone; zoney++) {
            for (let zonex = 0; zonex < precisionZone; zonex++) {
                minmax[zonex][zoney][0] = 0xFF;
                for (let zoney2 = 0; zoney2 < zoneHeight; zoney2++) {
                    for (let zonex2 = 0; zonex2 < zoneWidth; zonex2++) {
                        let cible = image.data[zoneWidth * zonex + zonex2 + (zoneHeight * zoney + zoney2) * this.width];
                        if (cible < minmax[zonex][zoney][0]) {
                            minmax[zonex][zoney][0] = cible;
                        }
                        if (cible > minmax[zonex][zoney][1]) {
                            minmax[zonex][zoney][1] = cible;
                        }
                    }
                }
            }
        }
        let moyenneZone = new Array(precisionZone);
        for (let i = 0; i < precisionZone; i++) {
            moyenneZone[i] = new Array(precisionZone);
        }
        for (let y = 0; y < precisionZone; y++) {
            for (let x = 0; x < precisionZone; x++) {
                moyenneZone[x][y] = Math.floor((minmax[x][y][0] + minmax[x][y][1]) / 2);
            }
        }
        return moyenneZone;
    }
    grayScaleBitMap(image) {
        let moyenneZone = this.getBrightness(image);
        let precisionZone = moyenneZone.length;
        let zoneWidth = Math.floor(this.width);
        let zoneHeight = Math.floor(this.height);

        let bitmap = new Uint8Array(this.width * this.height * 4);
        for (let zoney = 0; zoney < precisionZone; zoney++) {
            for (let zonex = 0; zonex < precisionZone; zonex++) {
                for (let zoney2 = 0; zoney2 < zoneHeight; zoney2++) {
                    for (let zonex2 = 0; zonex2 < zoneWidth; zonex2++) {
                        bitmap[zoneWidth * zonex + zonex2 + (zoneHeight * zoney + zoney2) * this.width] = (this.image.data[zoneWidth * zonex + zonex2 + (zoneHeight * zoney + zoney2) * this.width] < moyenneZone[zonex][zoney]) ? 0 : 1;
                    }
                }
            }
        }
        this.bitMap = bitmap;
        return;
    }
    getImage() {
        return this.image;
    }
    getImageBitMap() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let point = (x * 4) + (y * this.width * 4);
                if (this.bitMap[point] == 0) {
                    this.imageGreyScale.data[point] = 0;
                    this.imageGreyScale.data[point + 1] = 0;
                    this.imageGreyScale.data[point + 2] = 0;
                }
                else {
                    this.imageGreyScale.data[point] = 255;
                    this.imageGreyScale.data[point + 1] = 255;
                    this.imageGreyScale.data[point + 2] = 255;
                }
            }
        }
        return this.imageGreyScale;
    }
    scanImage(image,ctx) {
        let stateCount = new Array(5);
        stateCount[0] = 0;
        stateCount[1] = 0;
        stateCount[2] = 0;
        stateCount[3] = 0;
        stateCount[4] = 0;
        let currentState = 0;
        let pointList = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let point = (x * 4) + (y * this.width * 4);
                if (image.data[point] == 0) {
                    if (currentState == 1) {
                        currentState++;
                    }
                    stateCount[currentState]++;
                    pointList.push(point);
                }
                else {
                    if (currentState == 1) {
                        stateCount[currentState]++;
                        pointList.push(point);
                    }
                    else {
                        // ...but, we were counting black pixels
                        if (currentState == 4) {

                            // We found the 'white' area AFTER the finder pattern
                            // Do processing for it here
                            if (this.checkRatio(stateCount)) {

                                console.log("coucou");
                                console.log(stateCount);
                                //this.confirmedFound(image,stateCount,y,x);
                                //return image;
                                //Stage 1
                                // This is where we do some more checks
                                //return confirmed;
                            }
                            else {
                                currentState = 3;
                                stateCount[0] = stateCount[2];
                                stateCount[1] = stateCount[3];
                                stateCount[2] = stateCount[4];
                                stateCount[3] = 1;
                                stateCount[4] = 0;
                            }

                            currentState = 0;
                            stateCount[0] = 0;
                            stateCount[1] = 0;
                            stateCount[2] = 0;
                            stateCount[3] = 0;
                            stateCount[4] = 0;
                            pointList = [];
                        }
                        else {
                            // We still haven't go 'out' of the finder pattern yet
                            // So increment the state
                            // B->W transition
                            currentState++;
                            stateCount[currentState]++;
                            pointList.push(point);
                        }
                    }
                }
            }
        }
        return image;
    }
    checkRatio(stateCount)
    {
        let totalFinderSize = 0;
        for (let  i = 0; i < 5; i++)
        {
            let count = stateCount[i];
            totalFinderSize += count;
            if (count == 0){
                return false;
            }
        }

        if (totalFinderSize < 7){
            return false;
        }
        //Calculate the size of one module
        let moduleSize = Math.ceil(totalFinderSize / 7.0);
        let maxVariance = moduleSize / 2;
        let retVal = ((Math.abs(moduleSize - (stateCount[0])) < maxVariance) &&
            (Math.abs(moduleSize - (stateCount[1])) < maxVariance) &&
            (Math.abs(3 * moduleSize - (stateCount[2])) < 3 * maxVariance) &&
            (Math.abs(moduleSize - (stateCount[3])) < maxVariance) &&
            (Math.abs(moduleSize - (stateCount[4])) < maxVariance));
        return retVal;
    }
    /* confirmedFound(image,stateCount,row,col)
    {
        let stateCountTotal = 0;
        for (let i = 0; i < 5; i++)
        {
            stateCountTotal += stateCount[i];
        }
        let centerCol = this.centerFromEnd(stateCount,col);
        let centerRow = this.crossCheckVertical(image, row, centerCol, stateCount[2], stateCountTotal);
        let point = (col * 4) + (row * this.width * 4);
        console.log(centerRow);
        if (!centerRow.toString().includes(","))
        {
            return false;
        }

        // Cross check along the horizontal axis with the new center-row
        centerCol = this.crossCheckHorizontal(image, centerRow, centerCol, stateCount[2], stateCountTotal);
        if (!centerCol.toString().includes(","))
        {
            return false;
        }

        // Cross check along the diagonal with the new center row and col
        let validPattern = this.crossCheckDiagonal(image, centerRow, centerCol, stateCount[2], stateCountTotal);
        if (!validPattern)
        {
            return false;
        }
        return true;
    }
    centerFromEnd(stateCount,width)
    {
        return (width - stateCount[4]-stateCount[3]) - stateCount[2] /2;
    }
    crossCheckVertical(image, startRow, centerCol, centralCount, stateCountTotal)
    {

        let maxRows = this.height;
        let crossCheckStateCount = new Array(5);
        let row = startRow;
        let point = (centerCol * 4) + (row * this.width * 4);
        while (row >= 0 && image.data[point] == 0)
        {
            crossCheckStateCount[2]++;
            row--;
            point = (centerCol * 4) + (row * this.width * 4);
        }
        if (row < 0)
        {
            return 0;
        }
        while (row >= 0 && image.data[point] == 255 && crossCheckStateCount[1] < centralCount)
        {
            crossCheckStateCount[1]++;
            row--;
            point = (centerCol * 4) + (row * this.width * 4);
        }
        if (row < 0 || crossCheckStateCount[1] >= centralCount)
        {
            return 0;
        }
        while (row >= 0 && image.data[point] == 0 && crossCheckStateCount[0] < centralCount)
        {
            crossCheckStateCount[0]++;
            row--;
            point = (centerCol * 4) + (row * this.width * 4);
        }
        if (row < 0 || crossCheckStateCount[0] >= centralCount)
        {
            return 0;
        }

        // Now we traverse down the center
        row = startRow + 1;
        point = (centerCol * 4) + (row * this.width * 4);
        while (row < maxRows && image.data[point] == 0)
        {
            crossCheckStateCount[2]++;
            row++;
            point = (centerCol * 4) + (row * this.width * 4);
        }
        if (row == maxRows)
        {
            return 0;
        }
        point = (centerCol * 4) + (row * this.width * 4);
        while (row < maxRows && image.data[point] == 255 && crossCheckStateCount[3] < centralCount)
        {
            crossCheckStateCount[3]++;
            row++;
            point = (centerCol * 4) + (row * this.width * 4);
        }
        if (row == maxRows || crossCheckStateCount[3] >= stateCountTotal)
        {
            return 0;
        }
        point = (centerCol * 4) + (row * this.width * 4);
        while (row < maxRows && image.data[point] == 0 && crossCheckStateCount[4] < centralCount)
        {
            crossCheckStateCount[4]++;
            row++;
            point = (centerCol * 4) + (row * this.width * 4);
        }
        if (row == maxRows || crossCheckStateCount[4] >= centralCount)
        {
            return 0;
        }

        let crossCheckStateCountTotal = 0;
        for (let i = 0; i < 5; i++)
        {
            crossCheckStateCountTotal += crossCheckStateCount[i];
        }

        if (5 * Math.abs(crossCheckStateCountTotal - stateCountTotal) >= 2 * stateCountTotal)
        {
            return 0;
        }

        let center = this.centerFromEnd(crossCheckStateCount, row);
        return this.checkRatio(crossCheckStateCount) ? center : 0;
    }
    crossCheckHorizontal(image, centerRow, startCol, centerCount, stateCountTotal)
    {

        let maxCols = wi;
        let stateCount = new Array(5);

        let col = startCol;

        let point = (startCol * 4) + (centerRow * this.width * 4);
        while (col >= 0 && image.data[point] == 0)
        {
            stateCount[2]++;
            col--;
            point = (startCol * 4) + (centerRow * this.width * 4);
        }
        if (col < 0)
        {
            return 0;
        }
        point = (startCol * 4) + (centerRow * this.width * 4);
        while (col >= 0 && image.data[point] == 255 && stateCount[1] < centerCount)
        {
            stateCount[1]++;
            col--;
            point = (startCol * 4) + (centerRow * this.width * 4);
        }
        if (col < 0 || stateCount[1] == centerCount)
        {
            return 0;
        }
        point = (startCol * 4) + (centerRow * this.width * 4);
        while (col >= 0 && image.data[point] == 0 && stateCount[0] < centerCount)
        {
            stateCount[0]++;
            col--;
            point = (startCol * 4) + (centerRow * this.width * 4);
        }
        if (col < 0 || stateCount[0] == centerCount)
        {
            return 0;
        }

        col = startCol + 1;
        point = (startCol * 4) + (centerRow * this.width * 4);
        while (col < maxCols && image.data[point] == 0)
        {
            stateCount[2]++;
            col++;
            point = (startCol * 4) + (centerRow * this.width * 4);
        }
        if (col == maxCols)
        {
            return 0;
        }
        point = (startCol * 4) + (centerRow * this.width * 4);
        while (col < maxCols && image.data[point] == 255 && stateCount[3] < centerCount)
        {
            stateCount[3]++;
            col++;
            point = (startCol * 4) + (centerRow * this.width * 4);
        }
        if (col == maxCols || stateCount[3] == centerCount)
        {
            return 0;
        }
        point = (startCol * 4) + (centerRow * this.width * 4);
        while (col < maxCols && image.data[point] == 0 && stateCount[4] < centerCount)
        {
            stateCount[4]++;
            col++;
            point = (startCol * 4) + (centerRow * this.width * 4);
        }
        if (col == maxCols || stateCount[4] == centerCount)
        {
            return 0;
        }
        let newStateCountTotal = 0;
        for (let i = 0; i < 5; i++)
        {
            newStateCountTotal += stateCount[i];
        }

        if (5 * Math.abs(stateCountTotal - newStateCountTotal) >= stateCountTotal)
        {
            return 0;
        }

        return this.checkRatio(stateCount) ? this.centerFromEnd(stateCount, col) : 0;
    }
    crossCheckDiagonal(image, centerRow, centerCol, maxCount, stateCountTotal)
    {

        let stateCount = new Array(5);

        let i = 0;
        let point = (centerCol * 4) + (centerRow * this.width * 4);
        while (centerRow >= i && centerCol >= i && image.data[point] == 0)
        {
            stateCount[2]++;
            i++;
            point = (centerCol * 4) + (centerRow * this.width * 4);
        }
        if (centerRow < i || centerCol < i)
        {
            return false;
        }
        point = (centerCol * 4) + (centerRow * this.width * 4);
        while (centerRow >= i && centerCol >= i && image.data[point] == 255 && stateCount[1] <= maxCount)
        {
            stateCount[1]++;
            i++;
            point = (centerCol * 4) + (centerRow * this.width * 4);
        }
        if (centerRow < i || centerCol < i || stateCount[1] > maxCount)
        {
            return false;
        }
        point = (centerCol * 4) + (centerRow * this.width * 4);
        while (centerRow >= i && centerCol >= i && image.data[point] == 0 && stateCount[0] <= maxCount)
        {
            stateCount[0]++;
            i++;
            point = (centerCol * 4) + (centerRow * this.width * 4);
        }
        if (stateCount[0] > maxCount)
        {
            return false;
        }

        let maxCols = wi;
        let maxRows = he;
        i = 1;
        point = (centerCol * 4) + (centerRow * this.width * 4);
        while ((centerRow + i) < maxRows && (centerCol + i) < maxCols && image.data[point] == 0)
        {
            stateCount[2]++;
            i++;
            point = (centerCol * 4) + (centerRow * this.width * 4);
        }
        if ((centerRow + i) >= maxRows || (centerCol + i) >= maxCols)
        {
            return false;
        }
        point = (centerCol * 4) + (centerRow * this.width * 4);
        while ((centerRow + i) < maxRows && (centerCol + i) < maxCols && image.data[point] == 255 && stateCount[3] < maxCount)
        {
            stateCount[3]++;
            i++;
            point = (centerCol * 4) + (centerRow * this.width * 4);
        }
        if ((centerRow + i) >= maxRows || (centerCol + i) >= maxCols || stateCount[3] > maxCount)
        {
            return false;
        }
        point = (centerCol * 4) + (centerRow * this.width * 4);
        while ((centerRow + i) < maxRows && (centerCol + i) < maxCols && image.data[point] == 0 && stateCount[4] < maxCount)
        {
            stateCount[4]++;
            i++;
            point = (centerCol * 4) + (centerRow * this.width * 4);
        }
        if ((centerRow + i) >= maxRows || (centerCol + i) >= maxCols || stateCount[4] > maxCount)
        {
            return false;
        }
        let newStateCountTotal = 0;
        for (let  j = 0; j < 5; j++)
        {
            newStateCountTotal += stateCount[j];
        }

        return (Math.abs(stateCountTotal - newStateCountTotal) < 2 * stateCountTotal) && this.checkRatio(stateCount);
    } */
}