/**
 * @license TOMVi_1.3
 * Copyright 2018 Daisuke Kyoui
 * Released under the MIT license
 */

$.jCanvas.defaults.layer = true;
$.jCanvas.defaults.fromCenter = false;

//GLOBAL 
loadingData = new Object;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//response for button
//popup
function popup (box){
	//check the box, visible or hidden
	var _element = document.getElementById(box);
	var style = getComputedStyle(_element, null);
	var height = style.getPropertyValue("height");
	//open
	if(height == "0px"){
		$(".box").css({
			"height":	"0",
			"overflow":	"hidden",
			"border":	"",
		});			
		$("#" + box).css({
			"height":	"auto",
			"width":	"500px",
			"overflow":	"auto",
			"background-color":	"lightgray",
			"border":	"solid black",
			"border-width":	"1px",
			"z-index":	"1",
		});
	}else{
	//close
		$("#" + box).css({
			"height":	"0",
			"overflow":	"hidden",
			"border":	"",
		});
	}
}
/***********************************************************************************************************************/
//file button
function fileUpload (files, inputType){
	
	//background
	if(inputType == "background"){
		var reader = new FileReader();
		if(files[0].type != "image/png" && files[0].type != "image/jpeg"){
			alert('This file format is not supported!');
			return;
		}
	}
	
	//data
	if(inputType == "data"){
		var reader = new FileReader();
		if(files[0].type != "text/tab-separated-values" && files[0].type != "text/plain"){
			alert('This file format is not supported!');
			return;
		}
	}
}
function dataLoading(){
	//files
	var files = document.forms.loadingForm;
	var url = window.URL.createObjectURL(files.backgroundFile.files[0]);
	var dataFile = files.dataFile.files[0];
	
	//check files
	if(!document.getElementById("backgroundFile").value || !document.getElementById("dataFile").value){
		alert('Files are not existed');
		return;
	};
						
	//reading data file
	var reader = new FileReader();
	reader.readAsText(dataFile);
	//read table
	var table = new Array;
	var flag_read = 0;
	reader.addEventListener('load', function(){
		table = reader.result.split(/\r\n|\r|\n/);
		for(var i = 0, rowlen = table.length; i < table.length; i++){
			table[i] = table[i].split(/\t/);
		}
		flag_read = 1;
	});
	
	//make data
	var makeData = setInterval(function(){
		if(flag_read != 0){
			clearInterval(makeData);
			makeBackground(url);
			makeColor(table);
			makeRate(table);
			makePlot(table);
			makeLine(table);
			makeOtu(table);
			makeZoom();
			setLinkTable();
			makeCheckbox();
			drawing();
			popup('fileBox');
		}
	}, 500);

	//make background
	function makeBackground(url){
		//set canvas size after image loading
		var img = new Image();
		var flag_loading = 0;
		img.onload = function (){
			//get image size
			var imgSize = {
				width:	img.width,
				height:	img.height,
			}

			//set canvas size
			var canvasObj = document.getElementById("canvas");
			canvasObj.width = imgSize.width;
			canvasObj.height = imgSize.height;
			
			flag_loading = 1;
		};
		img.src = url;
		//make object
		var hoge = setInterval(function(){
			if(flag_loading != 0){
				loadingData.background = new Object;
				loadingData.background = {
					url: url,
					x: 0,
					y: 0,
					scale: 1,
					width: img.width,
					height: img.height,
				}
			}
		}, 500);
	}
	
	//make color
	function makeColor(table){
		loadingData.colors = new Object;
		var colors = loadingData.colors;
		for(var i = 1, rowlen = table.length; i < rowlen; i++){
			var otu = table[i][0];
			if(!otu){continue;};
			//hsl
			colors[otu] = {
				radian: (360/(rowlen)) * i,
			};
			colors[otu].hsl = [ colors[otu].radian, 90, 50 ];
			colors[otu].rgba = hslToRgb10.apply(null, colors[otu].hsl);
			colors[otu].rgba.Alpha = 0.6;
			colors[otu].rgbaString = "rgba(" + [ colors[otu].rgba.red, colors[otu].rgba.green, colors[otu].rgba.blue, colors[otu].rgba.Alpha ].join(',') + ")";
		}
	}

	//make plot
	function makePlot(table){
		loadingData.plots = new Object;
		var plots = loadingData.plots;
		var position = {
			x: 50,
			y: 50,
		}
		for(var col = 1, collen = table[0].length; col < collen; col++){
			//plot data
			plots[table[0][col]] = {
				name: table[0][col],
				x:	position.x,
				y:	position.y,
				radius: 20,
				labelSize: 12,
			}
			//position setting
			position.y = position.y + 50;
			if(position.y > 500){
				position.x = position.x + 50;
				position.y = 50;
			}
		};
	}
	
	//make rate
	function makeRate(table){
		loadingData.rates = new Object;
		for(var col = 1, collen = table[0].length; col < collen; col++){
			if(table[0][col] == ""){continue;};
			var plot = table[0][col];
			loadingData.rates[plot] = new Object;
			for(var row = 1, rowlen = table.length; row < rowlen; row++){
				if(table[row][0] == "" || table[row][col] == 0){continue;};
				var obj = {
					name:	[table[0][col], table[row][0], "rate"].join("_"),
					plot:	table[0][col],
					rate:	Number(table[row][col]),
					visible:	true,
				}
				var otu = table[row][0];
				loadingData.rates[plot][otu] = obj;
			}
		}
	}
		
	//make line
	function makeLine(table){
		loadingData.lines = new Object;
		var lines = loadingData.lines;
		for(var plot1 = 1, collen = table[0].length; plot1 < collen; plot1++){
			for (var col = plot1 + 1, collen = table[0].length; col < collen; col++){
				for(var row = 1, rowlen = table.length; row < rowlen; row++){
					if(table[row][0] == ""){continue;};
					if(table[row][plot1] == 0 || table[row][col] == 0){continue;};
					var name = [table[row][0], table[0][plot1], table[0][col], "link"].join("_")
					lines[name] = {
						name:	name,
						otu:	table[row][0],
						plot1:	table[0][plot1],
						plot2:	table[0][col],
						link:	[table[0][plot1], table[0][col]].join("_"),
						visible:	true,
					}
				}
			}
		}
	}
	
	//make otu
	function makeOtu(table){
		loadingData.otus = new Array;
		otus = loadingData.otus;
		for(var row = 1, rowlen = table.length; row < rowlen; row++){
			if(table[row][0] == ""){continue;};
			otus.push(table[row][0]);
		}
	}
	
	//make zoom
	function makeZoom(){
		loadingData.zoom = 1;
	}
}
function saveImage(saveType){
	//saveType
	var imageType = "image/png";
	var fileName = "tomvi_image.png";
	if(saveType == "jpeg"){
		imageType = "image/jpeg";
		fileName = "tomvi_image.jpg";
	}
	//convert
	var canvas = document.getElementById("canvas");
	var base64 = canvas.toDataURL(imageType);
	var blob = (function(base64) {
		var tmp = base64.split(',');
		var data = atob(tmp[1]);
		var mime = tmp[0].split(':')[1].split(';')[0];
		var buf = new Uint8Array(data.length);
		for (var i = 0; i < data.length; i++) {
			buf[i] = data.charCodeAt(i);
		}
		var blob = new Blob([buf], { type: mime });
		return blob;
	}(base64));	
	//writing
	const a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.download = fileName;
	a.style.display = 'none';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	//close box
	popup('fileBox');
}
function saveTable(saveType){
	//Input
	var colors = loadingData.colors;
	var otus = loadingData.otus;
	var checks = loadingData.checkbox.checks;
	
	//make canvas
	var legendCanvas = document.createElement("canvas");
	legendCanvas.setAttribute("id", "legendCanvas");
	legendCanvas.style = "border: solid;";
	document.body.appendChild(legendCanvas);
	var height = 0;
	var width = 0;
	for(var otu of otus){
		if(checks[otu] === true){
			height = height + 1;
			if(otu.length > width){
				width = otu.length;
			};
		};
	};
	legendCanvas.height = Number(20 + height * 25);
	legendCanvas.width = Number(width * 12) + 100;
	
	//make legend
	var position = 20;
	$("#legendCanvas").drawRect({
		fillStyle: "white",
		x: 0,
		y: 0,
		height: height * 100,
		width: width * 100,
		fromCenter:	false,
	});
	for(var otu of otus){
		if(checks[otu] === true){
			$("#legendCanvas").drawRect({
				fillStyle: colors[otu].rgbaString,
				x: 20,
				y: position,
				width: 20,
				height: 20,
				fromCenter: false,
			}).drawText({
				strokeStyle: "#000",
				fillStyle: "#000",
				x: 60,
				y: position,
				fontSize: 20,
				text: otu,
				fromCenter: false,
			});
			position = position + 25;
		}
	}

	//saveType
	var imageType = "image/png";
	var fileName = "tomvi_legend.png";
	if(saveType == "jpeg"){
		imageType = "image/jpeg";
		fileName = "tomvi_legend.jpg";
	}
	//convert
	var canvas = document.getElementById("legendCanvas");
	var base64 = canvas.toDataURL(imageType);
	var blob = (function(base64) {
		var tmp = base64.split(',');
		var data = atob(tmp[1]);
		var mime = tmp[0].split(':')[1].split(';')[0];
		var buf = new Uint8Array(data.length);
		for (var i = 0; i < data.length; i++) {
			buf[i] = data.charCodeAt(i);
		}
		var blob = new Blob([buf], { type: mime });
		return blob;
	}(base64));	
	//writing
	const a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.download = fileName;
	a.style.display = 'none';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	document.body.removeChild(legendCanvas);
	//close box
	popup('fileBox');	
	
}
/************************************************************************************************************************/
//Draw Line Button
function redrawLines(){
	//input
	var lines = loadingData.lines;
	var colors = loadingData.colors;
	//process
	for(var line in lines){
		reSetLine(lines[line], colors);
	}
	setIndex();
	
	//re-set line positions
	function reSetLine(line, colors){
		var color = colors[line.otu].rgbaString;
		$("#canvas").setLayer(line.name, {
			visible: line.visible,
			fn: function(otu) {
				otu.beginPath();
				otu.moveTo(line.position.point0.x, line.position.point0.y);
				otu.lineTo(line.position.point1.x, line.position.point1.y);
				otu.lineTo(line.position.point2.x, line.position.point2.y);
				otu.lineTo(line.position.point3.x, line.position.point3.y);
				otu.lineTo(line.position.point4.x, line.position.point4.y);
				otu.lineTo(line.position.point5.x, line.position.point5.y);
				otu.lineTo(line.position.point0.x, line.position.point0.y);
				otu.closePath();
				otu.fillStyle = color;
				otu.fill();
			},
		});
	};
}
/***********************************************************************************************************************/
//set link Button
function setLinkTable (){
	//Input
	plots = loadingData.plots;
	tbody = document.getElementById("hiddenLinksTableBody");
	
	//write table body
	tbody.innerHTML = 	"<tr>" +
							"<td>" +
								"<select>" +
								"<option><option>" +
								makeSelect() +
								"</select>" +
							"</td>" +
							"<td>" +
								"<select>" +
								"<option><option>" +
								makeSelect() +
								"</select>" +
							"</td>" +
							"<td>" + 
								"<button type='button' onclick='addRow(this)'>+</button>" +
								"<button type='button' onclick='delRow(this)'>-</button>" +
							"</td>" +
						"</tr>";
	
	function makeSelect(){
		var select = "";
		for(var plot in plots){
			select = select + "<option>" + plots[plot].name + "</option>";
		}
		return select;
	}
								
}
//add raw
function addRow(obj){
	var tr = obj.parentNode.parentNode;
	tr.parentNode.insertBefore(tr.cloneNode(true), tr.nextSibling);
}
//delete raw
function delRow(obj){
	var tr = obj.parentNode.parentNode;
	//protect last 1 line
	var raws = tr.parentNode.children;
	if(raws.length == 1){
		return;
	}
	//add clone raw
	tr.parentNode.deleteRow(tr.sectionRowIndex);
}
//apply set links
function applyLinks(){
	//Input
	var targetLinks = new Array;
	var lines = loadingData.lines;
	var table = document.getElementById("hiddenLinksTableBody");
	var visible = document.getElementById("setLinkRadio");
	
	//read table
	for( var i = 0, rowlen = table.rows.length; i < rowlen; i++){
		targetLinks[i] = new Array;
		for (var j = 0; j < 2; j++){
			if(table.rows[i].cells[j].children[0].value != ""){
				targetLinks[i].push(table.rows[i].cells[j].children[0].value);
			}
		}
	}
	
	// set status
	var status = [];
	if(visible.radio.value == "hidden"){
		status[0] = false;
		status[1] = true;
	} else if (visible.radio.value == "visible"){
		status[0] = true;
		status[1] = false;
	}
		
	//setting loadingData.lines
	for(var line in loadingData.lines){
		line = loadingData.lines[line];
		line.visible = status[1];
		for( var i = 0, targetLinkslen = targetLinks.length; i < targetLinkslen; i++){
			if(targetLinks[i].length < 2){continue;};
			if(targetLinks[i].indexOf(line.plot1) >= 0 && targetLinks[i].indexOf(line.plot2) >= 0){
				line.visible = status[0];
			};
		};
	};
	
	//redraw lines
	redrawLines();
	//close popup
	popup("setLinkBox");
}
function uploadLinksTable(files){
	//reading file
	var reader = new FileReader();
	if(files[0].type != "text/tab-separated-values" && files[0].type != "text/plain"){
		alert('This file format is not supported!')
		return;
	}
	reader.readAsText(files[0]);
	//reading html table
	var table = document.getElementById("hiddenLinksTableBody");
	var tableRowNum = -1;
	//input
	reader.addEventListener('load', function(){
		var row = reader.result.split(/\r\n|\r|\n/);
		//add rows
		while(table.rows.length < row.length){
			var obj = table.rows[0].cells[2].children[0];
			addRow(obj);
		}
		//data load
		for( var i = 0, rowlen = row.length; i < rowlen; i++){
			if(row[i].indexOf('#') == 0){
				continue;
			};
			tableRowNum++;
			var cell = row[i].split(/\t/);
 			for(var j = 0; j < 2; j++){
				var value = cell[j];
				table.rows[tableRowNum].cells[j].children[0].value = value;
			}
		}
		//apply links
		applyLinks();
	});
}
/************************************************************************************************************************/
//Configure Button
//apply configure
function applyConfigure(){
	//reading configure data
	var forms = document.getElementById("setConfigureBox").getElementsByTagName("form");
	var formPlot = forms.plot.getElementsByTagName("input");
	var formColor = forms.color.getElementsByTagName("input");
	var formBackground = forms.background.getElementsByTagName("input");

	//rewrite loadingData
	for(var background of [loadingData.background]){
		background.scale = formBackground.zoom.value / 100;
		background.x = (-1) * background.width * (1-background.scale) / 2;
		background.y = (-1) * background.height * (1-background.scale) / 2;
	};
	for(var plot in loadingData.plots){
		plot = loadingData.plots[plot];
		plot.radius = Number(formPlot.plotSize.value);
		plot.labelSize = Number(formPlot.textSize.value);
	};
	for(var color in loadingData.colors){
		color = loadingData.colors[color];
		color.rgba.Alpha = formColor.transparency.value;
		color.rgbaString = "rgba(" + [ color.rgba.red, color.rgba.green, color.rgba.blue, color.rgba.Alpha ].join(',') + ")";
	}
	
	//re-set background
	for(var background of [loadingData.background]){
		//resize canvas
		var canvas = document.getElementById("canvas");
		canvas.width = background.width * background.scale;
		canvas.height = background.height * background.scale;
		//re-set background
		$("#canvas").setLayer("background", {
			scale: background.scale,
			x: background.x,
			y: background.y,
		});
	};
	
	//re-set plot
	for (var plot in loadingData.plots){
		$("#canvas").setLayerGroup("plot", {
			radius: formPlot.plotSize.value,
		});
	};
	
	//re-set rate
	$("canvas").setLayerGroup("slice", {
		radius: formPlot.plotSize.value,
	});
	for(var plot in loadingData.rates){
		for(var otu in loadingData.rates[plot]){
			$("canvas").setLayer(loadingData.rates[plot][otu].name, {
				fillStyle: loadingData.colors[otu].rgbaString,
			});
		};
	};
	
	//re-set label
	for (var plot in loadingData.plots){
		plot = loadingData.plots[plot];
		$("#canvas").setLayer(plot.name + "-text", {
			y: plot.y + plot.radius + plot.labelSize / 2,
			fontSize: plot.labelSize,			
		});
	};	
		
	//re-set line
	for(var line in loadingData.lines){
		line = loadingData.lines[line];
		setLinePosition(line);
	};
	redrawLines();

	//close popup
	popup('setConfigureBox')
}
/************************************************************************************************************************/
//Checkbox
//make checkbox
function makeCheckbox(){
	//Input
	var plots = loadingData.plots;
	var colors = loadingData.colors;
	var otus = loadingData.otus;
	var thead = document.getElementById("checkboxTableHeader");
	var tbody = document.getElementById("checkboxTableBody");

	//Process
	makeLoadingDataCheckbox();
	checkboxLoading();
	setTableBodyHeight();
	
	//make loadingData.checkbox;
	function makeLoadingDataCheckbox(){
		loadingData.checkbox = {
			header: {},
			body: {},
		};
		//header
		loadingData.checkbox.header = {
			row0: ["otu"],
			row1: ["<button type=\'button\' onclick=\'otuSort(\"otu\", 0)\'>&#9660</button>"],
		};
		//body
		loadingData.checkbox.body.all = "<label class='checkboxList'>" +
											"<input " +
												"type='checkbox' "+
												"id='checkbox_all' " +
												"value='all' " +
												"checked='true' "+
												"onClick=responseForCheckbox('all') "+
											"/>" +
											"all" +
										"</label>";
		for(var otu of otus){
			loadingData.checkbox.body[otu] = [
				"<label class='checkboxList' >" +
					"<input " +
						"type='checkbox' "+
						"id='checkbox_" + otu + "' " +
						"value=" + otu + " " +
						"checked='true'" +
						"onClick=responseForCheckbox('" + otu +"')" +
					">" +
					otu +
				"</label>"
			];
		};
		//checkbox otu list
		loadingData.checkbox.lists = new Array;
		loadingData.checkbox.lists = otus;
		//checkbox check list
		loadingData.checkbox.checks = new Object;
		loadingData.checkbox.checks.all = true;
		for(var otu of otus){
			loadingData.checkbox.checks[otu] = true;
		}
	}
	
	//loadingData
	function checkboxLoading(){
		//head
		var innerHTML = "<tr>" +
							"<th>" +
								loadingData.checkbox.header.row0[0] + 
							"</th>" +
						"</tr>" +
						"<tr>" +
							"<th>" +
								loadingData.checkbox.header.row1[0] + 
							"</th>" +
						"</tr>";
		thead.innerHTML = innerHTML;
		//body
		innerHTML = new String;
		innerHTML =	"<tr>" +
						"<td>" +
							loadingData.checkbox.body.all +
						"</td>" +
					"</tr>";
		for(var otu of loadingData.checkbox.lists){
			innerHTML =	innerHTML +
						"<tr Style=background-color:" + colors[otu].rgbaString +">" +
							"<td>" +
								loadingData.checkbox.body[otu][0] +
							"</td>" +
						"</tr>";
		}
		tbody.innerHTML = innerHTML;
	}
	
	//set table body height
	function setTableBodyHeight(){
		var displayHeight = document.documentElement.clientHeight;
		var headerHeight = document.getElementById("checkboxTableHeader").offsetHeight;
		$("#checkboxForm tbody").css({
			"max-height":	(displayHeight  - (70 + headerHeight)) + "px",
		});
	}
}	
//show rate
function showRate(plot){
	//input
	var rates = loadingData.rates;
	var colors = loadingData.colors;
	var header = loadingData.checkbox.header;
	var body = loadingData.checkbox.body;
	var lists = loadingData.checkbox.lists;
	var tbody = document.getElementById("checkboxTableBody");
	var thead = document.getElementById("checkboxTableHeader");
	
	//loadingData rewrite
	//head
	header.row0.push(plot);
	header.row1.push(	"<button type=\'button\' onclick=\"otuSort(\'" + plot + "\', " + header.row1.length + ")\">&#9660</button>" + 
						"<button type=\'button\' onclick=\"deleteColumn(\'" + plot + "\', " + header.row1.length + "\)\">&#10005</button>"
					);
	//body
	for(var otu of lists){
		var addBody = new String;
		if(rates[plot][otu] && rates[plot][otu].rate * 100 > 0.01){
			addBody = (rates[plot][otu].rate * 100).toFixed(2) + "%";
		}else{
			addBody = "<0.01%";
		}
		body[otu].push(addBody);
	}
		
	//checkbox rewrite
	//head
	var innerHTML = "<tr>" +
						"<th>" +
							header.row0.join("</th><th>") + 
						"</th>" +
					"</tr>" +
					"<tr>" +
						"<th>" +
							header.row1.join("</th><th>") + 
						"</th>" +
					"</tr>";
	thead.innerHTML = innerHTML;
	//body
	innerHTML = new String;
	innerHTML =	"<tr>" +
					"<td>" +
						loadingData.checkbox.body.all +
					"</td>" +
				"</tr>";
	for(var otu of lists){
		innerHTML =	innerHTML +
					"<tr Style=background-color:" + colors[otu].rgbaString +">" +
						"<td>" +
							loadingData.checkbox.body[otu].join("</td><td>") +
						"</td>" +
					"</tr>";
	}
	tbody.innerHTML = innerHTML;
}
function deleteColumn(plot, col){
	//input
	var colors = loadingData.colors;
	var lists = loadingData.checkbox.lists;
	var header = loadingData.checkbox.header;
	var body = loadingData.checkbox.body;
	var tbody = document.getElementById("checkboxTableBody");
	var thead = document.getElementById("checkboxTableHeader");	
	
	//rewrite loadingData
	//header
	header.row0.splice(col,1);
	header.row1.splice(col,1);
	for(var i = 1, len = header.row1.length; i < len; i++){
		header.row1[i] ="<button type=\'button\' onclick=\"otuSort(\'" + plot + "\', " + i + ")\">&#9660</button>" + 
						"<button type=\'button\' onclick=\"deleteColumn(\'" + plot + "\', " + i + "\)\">&#10005</button>";
	}
	//body
	for(var otu of otus){
		loadingData.checkbox.body[otu].splice(col,1);
	}
	//list
	if(header.row0.length <= 1){
		loadingData.checkbox.lists = loadingData.otus;
		lists = loadingData.otus;
	}

	//checkbox rewrite
	//head
	var innerHTML = "<tr>" +
						"<th>" +
							header.row0.join("</th><th>") + 
						"</th>" +
					"</tr>" +
					"<tr>" +
						"<th>" +
							header.row1.join("</th><th>") + 
						"</th>" +
					"</tr>";
	thead.innerHTML = innerHTML;
	//body
	innerHTML = new String;
	innerHTML =	"<tr>" +
					"<td>" +
						loadingData.checkbox.body.all +
					"</td>" +
				"</tr>";
	for(var otu of lists){
		innerHTML =	innerHTML +
					"<tr Style=background-color:" + colors[otu].rgbaString +">" +
						"<td>" +
							loadingData.checkbox.body[otu].join("</td><td>") +
						"</td>" +
					"</tr>";
	}
	tbody.innerHTML = innerHTML;
}
function otuSort(plot, col){
	//input
	var rates = loadingData.rates;
	var colors = loadingData.colors;
	var header = loadingData.checkbox.header;
	var body = loadingData.checkbox.body;
	var lists = loadingData.checkbox.lists;
	var tbody = document.getElementById("checkboxTableBody");
	var thead = document.getElementById("checkboxTableHeader");
		
	//rewrite loadingData
	var lists = new Array;
	if(plot == "otu"){
		lists = loadingData.otus;
	} else {
		lists = loadingData.checkbox.lists.slice().sort(function(a,b){
			if(!rates[plot][a]){return 1};
			if(!rates[plot][b]){return -1};			
			if(rates[plot][a].rate > rates[plot][b].rate){return -1};
			if(rates[plot][a].rate < rates[plot][b].rate){return 1};
			return 0;
		});
		loadingData.checkbox.lists = lists;
	}
	
	//checkbox rewrite
	//head
	var innerHTML = "<tr>" +
						"<th>" +
							header.row0.join("</th><th>") + 
						"</th>" +
					"</tr>" +
					"<tr>" +
						"<th>" +
							header.row1.join("</th><th>") + 
						"</th>" +
					"</tr>";
	thead.innerHTML = innerHTML;
	//body
	innerHTML = new String;
	innerHTML =	"<tr>" +
					"<td>" +
						loadingData.checkbox.body.all +
					"</td>" +
				"</tr>";
				
	for(var otu of lists){
		innerHTML =	innerHTML +
					"<tr Style=background-color:" + colors[otu].rgbaString +">" +
						"<td>" +
							loadingData.checkbox.body[otu].join("</td><td>") +
						"</td>" +
					"</tr>";
	}
	tbody.innerHTML = innerHTML;
	
	//re-set checkbox status
	for(var otu in loadingData.checkbox.checks){
		document.getElementById("checkbox_" + otu).checked = loadingData.checkbox.checks[otu];
	}
	
}
function responseForCheckbox(otu){
	//input
	var rates = loadingData.rates;
	var lines = loadingData.lines;
	var otus = loadingData.otus;
	var checks = loadingData.checkbox.checks;
	var status = document.getElementById("checkbox_" + otu).checked;
	
	//rewrite loading data
	if(otu == "all"){
		//checkbox check
		for(var otu in checks){
			checks[otu] = status;
			loadingData.checkbox.body[otu][0] =	"<label class='checkboxList' >" +
													"<input " +
														"type='checkbox' "+
														"id='checkbox_" + otu + "' " +
														"value=" + otu + " " +
														"checked='" + status + "' " +
														"onClick=responseForCheckbox('" + otu +"')" +
													">" +
													otu +
												"</label>";
		}
		//rate
		for(var plot in rates){
			for(var otu of Object.keys(rates[plot])){
				rates[plot][otu].visible = status;
			}
		}
		//line
		for(var line in lines){
			lines[line].visible = status;
		}	
	}else{
		//checkbox check
		checks[otu] = status;
		loadingData.checkbox.body[otu][0] =	"<label class='checkboxList' >" +
												"<input " +
													"type='checkbox' "+
													"id='checkbox_" + otu + "' " +
													"value=" + otu + " " +
													"checked='" + status + "' " +
													"onClick=responseForCheckbox('" + otu +"')" +
												">" +
												otu +
											"</label>";		
		//rate
		for(var plot in rates){
			if(!rates[plot][otu]){continue;};
				rates[plot][otu].visible = status;
		}
		//lines
		for(var line in lines){
			if(lines[line].otu == otu){
				lines[line].visible = status;
			}
		}
	}
	for (var otu in checks){
		if(checks[otu] === false){
			loadingData.checkbox.body.all = "<label class='checkboxList'>" +
											"<input " +
												"type='checkbox' "+
												"id='checkbox_all' " +
												"value='all' " +
												"checked='" + false + "' " +
												"onClick=responseForCheckbox('all') "+
											"/>" +
											"all" +
										"</label>";
			break;
		}else{
			loadingData.checkbox.body.all = "<label class='checkboxList'>" +
											"<input " +
												"type='checkbox' "+
												"id='checkbox_all' " +
												"value='all' " +
												"checked='" + true + "' " +
												"onClick=responseForCheckbox('all') "+
											"/>" +
											"all" +
										"</label>";
		}
	}
	
	//responce to canvas
	//all
	var checkbox = document.getElementById("checkbox_all");
	for (var otu in checks){
		if(checks[otu] == false){
			checkbox.checked = false;
			break;
		}else{
			checkbox.checked = true;
		}
	}
	for(var otu in checks){
		var checkbox = document.getElementById("checkbox_" + otu);
		checkbox.checked = checks[otu];
	}	
	//rate
	for (var plot in rates){
		var start = 0;
		//sort
		var otuList = Object.keys(rates[plot]);
		otuList.sort(function(a,b){
			if(rates[plot][a].rate > rates[plot][b].rate){return -1};
			if(rates[plot][a].rate < rates[plot][b].rate){return 1};
			return 0;
		});
		for(var otu of otuList){
			if(rates[plot][otu].visible === true){
				$("canvas").setLayer(rates[plot][otu].name,{
					start: start,
					end: start + rates[plot][otu].rate*360,
					visible: true,
				});
				start = start + rates[plot][otu].rate*360;
			}else if(rates[plot][otu].visible !== true){
				$("canvas").setLayer(rates[plot][otu].name,{
					visible: false,
				});
			}
		}
	}
	$("canvas").drawLayers();
	//line
	for (var line in lines){
		setRadian(lines[line], rates, otus);
		setLinePosition(lines[line]);
	};
	redrawLines();

}
/************************************************************************************************************************/
//zoom
function zoom(value){
	//set scale
	var zoom = loadingData.zoom;
	if(value == "plus"){
		zoom = zoom + 0.05;
	}else if(value == "minus"){
		zoom = zoom - 0.05;		
	}else if(value == "native"){
		zoom = 1;
	}
	
	//canvas resize
	var canvasObj = document.getElementById("canvas");	
	canvasObj.width = loadingData.background.width * zoom;
	canvasObj.height = loadingData.background.height * zoom;
	
	//zoom
	canvasObj2D = canvasObj.getContext('2d');
	canvasObj2D.setTransform(zoom,0,0,zoom,0,0);	
	
	//feedback
	loadingData.zoom = zoom;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//drawing
function drawing(){
	drawBackground();
	drawPlot();
	drawLine();
	setIndex();
}
/************************************************************************************************************************/
//draw Background
function drawBackground(){
	var hoge = setInterval(function(){
		if(loadingData.background){
			clearInterval(hoge);
			var background = loadingData.background;
			$('#canvas').drawImage({
				name: "background",
				source: background.url,
				x: background.x,
				y: background.y,
				index: 0,
			});
		}
	}, 500);
}
/************************************************************************************************************************/
//Plot
function drawPlot(){
	//Input
	var plots = loadingData.plots;
	var rates = loadingData.rates;
	var colors = loadingData.colors;
	var otus = loadingData.otus;
	
	//process
	for(var plot in plots){
		drawCircle(plots[plot]);
		drawRate(plots[plot], rates, colors, otus);
		drawLabel(plots[plot]);
	}
}
//drawCircle
function drawCircle(plot){
	$('#canvas').drawArc({
		fillStyle: "white",
		strokeStyle: "black",
		x: plot.x,
		y: plot.y,
		fromCenter: true,
		radius: plot.radius,
		name: plot.name + "-plot",
		draggable: true,
		groups: [plot.name, "plot"],
		dragGroups: [plot.name],
		dragstart: function(){
			func_dragStart(plot);
		},
		dragstop: function(){
			func_dragStop(plot);
		},
	});
}	
//drawRate
function drawRate(plot, rates, colors, otus){
	//sort
	var otuList = Object.keys(rates[plot.name]);
	otuList.sort(function(a,b){
		if(rates[plot.name][a].rate > rates[plot.name][b].rate){return -1};
		if(rates[plot.name][a].rate < rates[plot.name][b].rate){return 1};
		return 0;
	});
	//draw percentage
	var start = 0;
	var ratesInPlot = rates[plot.name];
	for (var otu of otuList){
		if(ratesInPlot.visible === false){continue;};
		$('#canvas').drawSlice({
			x: plot.x, 
			y: plot.y,
			fromCenter: true,
			radius: plot.radius,
			fillStyle: colors[otu].rgbaString,
			start: start,
			end: start + ratesInPlot[otu].rate*360,
			name: ratesInPlot[otu].name,
			groups: [ratesInPlot[otu].plot, "slice", ratesInPlot[otu].plot + "-slice", otu + "-slice", otu],
			draggable: true,
			dragGroups: [ratesInPlot[otu].plot],
			dragstart: function(){
				func_dragStart(plot);
			},
			dragstop: function(){
				func_dragStop(plot);
			},
		});
		start = start + ratesInPlot[otu].rate*360;
	}
}
	
function drawLabel(plot){
	//make label
	$('#canvas').drawText({
		x: plot.x,
		y: plot.y + plot.radius + plot.labelSize/2,
		fromCenter: true,
		strokeStyle: "black",
		fillStyle: "black",
		strokeWidth: 1,
		fontFamily: "sans-serif",
		fontSize: plot.labelSize,
		name: plot.name + "-text",
		groups: [plot.name, "text"],
		draggable: true,
		dragGroups: [plot.name],
		text: plot.name,
		click: function(){showRate(plot.name)},
		mouseover: function(){$("#canvas").setLayer(plot.name + '-text', {fontStyle: 'bold'})},
		mouseout: function(){$("#canvas").setLayer(plot.name + '-text', {fontStyle: 'normal'})},
	});
}
/************************************************************************************************************************/
//Line
function drawLine(){
	//Input
	var colors = loadingData.colors;
	var rates = loadingData.rates;
	var plots = loadingData.plots;
	var lines = loadingData.lines;
	var otus = loadingData.otus;
	
	//process
	for (var line in lines){
		setRadian(lines[line], rates, otus);
		setLinePosition(lines[line]);
		makeLine(lines[line], colors);
	};
}
//set radian
function setRadian (line, rates, otus){
	//share otus
	var shareOtus = new Array;
	for(var otu of otus){
		if(rates[line.plot1][otu] && rates[line.plot2][otu]){
			shareOtus.push(otu);
		};
	};	
	//total radian
	var radian = {
		plot1: {
			total: 0,
		},
		plot2: {
			total: 0,
		}
	};
	for(var plot of ["plot1", "plot2"]){
		var ratesInPlot = rates[line[plot]];
		for(var rate in ratesInPlot){
			if(ratesInPlot[rate].visible !== true || line.visible !== true){continue;};
			radian[plot].total = radian[plot].total + ratesInPlot[rate].rate * Math.PI;
		};
	};
	//setRadian
	for(plot of ["plot1", "plot2"]){
		var total = 0;
		for(var otu of shareOtus){
			if(rates[line[plot]][otu].visible !== true){continue;};
			if(otu == line.otu){
				radian[plot].start = total;
				radian[plot].end = total + rates[line[plot]][otu].rate;
				break;
			}
			total = total + rates[line[plot]][otu].rate;
		}
	}
	line.radian = radian;
}
//makeLine
function setLinePosition(line){
	//get plot position
	var plot1Layer = loadingData.plots[line.plot1];
	var plot2Layer = loadingData.plots[line.plot2];
	//plot radian
	var radian1 = Math.atan2(plot2Layer.y - plot1Layer.y, plot2Layer.x - plot1Layer.x);
	var radian2 = Math.atan2(plot1Layer.y - plot2Layer.y, plot1Layer.x - plot2Layer.x);
	//make position
	var plot1Start = radian1 - (line.radian.plot1.total / 2);
	var plot2Start = radian2 + (line.radian.plot2.total / 2);
	line.position = {
		point0: {
			x: plot1Layer.x,
			y: plot1Layer.y,
		},
		point1: {
			x: plot1Layer.x + plot1Layer.radius * Math.cos(plot1Start + line.radian.plot1.start * Math.PI),
			y: plot1Layer.y + plot1Layer.radius * Math.sin(plot1Start + line.radian.plot1.start * Math.PI),
		},
		point2: {
			x: plot2Layer.x + plot2Layer.radius * Math.cos(plot2Start - line.radian.plot2.start * Math.PI),
			y: plot2Layer.y + plot2Layer.radius * Math.sin(plot2Start - line.radian.plot2.start * Math.PI),
		},
		point3: {
			x: plot2Layer.x,
			y: plot2Layer.y,
		},
		point4: {
			x: plot2Layer.x + plot2Layer.radius * Math.cos(plot2Start - line.radian.plot2.end * Math.PI),
			y: plot2Layer.y + plot2Layer.radius * Math.sin(plot2Start - line.radian.plot2.end * Math.PI),
		},
		point5: {
			x: plot1Layer.x + plot1Layer.radius * Math.cos(plot1Start + line.radian.plot1.end * Math.PI),
			y: plot1Layer.y + plot1Layer.radius * Math.sin(plot1Start + line.radian.plot1.end * Math.PI),
		},
	};
}
function makeLine(line, colors){
	//draw link
	var color = colors[line.otu].rgbaString;
	$("#canvas").draw({
		index: 1,
		name: line.name,
		groups: ["link", line.otu, line.plot1 + "-link", line.plot2 + "-link"],
		fn: function(otu) {
			otu.beginPath();
			otu.moveTo(line.position.point0.x, line.position.point0.y);
			otu.lineTo(line.position.point1.x, line.position.point1.y);
			otu.lineTo(line.position.point2.x, line.position.point2.y);
			otu.lineTo(line.position.point3.x, line.position.point3.y);
			otu.lineTo(line.position.point4.x, line.position.point4.y);
			otu.lineTo(line.position.point5.x, line.position.point5.y);
			otu.lineTo(line.position.point0.x, line.position.point0.y);
			otu.closePath();
			otu.fillStyle = color;
			otu.fill();
		},
	});
}

/************************************************************************************************************************/
//set Index
function setIndex(){
	var index = 0;
	//background
	$("#canvas").moveLayer('background', index);
	index++;
	//sorting elements
	var groups = ['link', 'plot', 'slice', 'text'];
	for (var group in groups){
		var layers = $("#canvas").getLayerGroup(groups[group]);
		for (var layer in layers){
			$("#canvas").moveLayer(layers[layer].name, index);
			index++;
		}
	}
	//redraw
	$("#canvas").drawLayers();
}
/************************************************************************************************************************/
//hslToRGB
function hslToRgb10(hue, saturation, lightness) {
	var result = false;
 
	if (((hue || hue === 0) && hue <= 360) && ((saturation || saturation === 0) && saturation <= 100) && ((lightness || lightness === 0) && lightness <= 100)) {
		var red   = 0,
			green = 0,
			blue  = 0,
			q     = 0,
			p     = 0;
 
		hue        = Number(hue)        / 360;
		saturation = Number(saturation) / 100;
		lightness  = Number(lightness)  / 100;
 
		if (saturation === 0) {
			red   = lightness;
			green = lightness;
			blue  = lightness;
		} else {
			var hueToRgb = function(p, q, t) {
				if (t < 0) {
					t += 1;
				}
 
				if (t > 1) {
					t -= 1;
				}
 
				if (t < 1 / 6) {
					p = p + (q - p) * 6 * t;
				} else if (t < 1 / 2) {
					p = q;
				} else if (t < 2 / 3) {
					p = p + (q - p) * (2 / 3 - t) * 6;
				}
 
				return p;
			};
 
			if (lightness < 0.5) {
				q = lightness * (1 + saturation);
			} else {
				q = lightness + saturation - lightness * saturation;
			}
			p = 2 * lightness - q;
 
			red   = hueToRgb(p, q, hue + 1 / 3);
			green = hueToRgb(p, q, hue);
			blue  = hueToRgb(p, q, hue - 1 / 3);
		}
 
		result = {
			red   : Math.round(red   * 255),
			green : Math.round(green * 255),
			blue  : Math.round(blue  * 255)
		};
	}
 
	return result;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Response to drag
function func_dragStart(plot){
	$("#canvas").setLayerGroup(plot.name + "-link", {
		visible: false,
	}).drawLayers();
}
function func_dragStop(plot){
	//loadingData.plots rewrite
	var targetPlot = $("#canvas").getLayer(plot.name + "-plot");
	plot.x = targetPlot.x;
	plot.y = targetPlot.y;
	//loadingData.lines rewrite
	var targetLines = $("#canvas").getLayerGroup(plot.name + "-link");
	var lines = loadingData.lines;
	var rates = loadingData.rates;
	var otus = loadingData.otus;
	for(var targetLine in targetLines){
		var line = lines[targetLines[targetLine].name];
		if(!line){continue;};
		setRadian(line, rates, otus);
		setLinePosition(line);
	}
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
