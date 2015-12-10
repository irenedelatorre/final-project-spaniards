// CANVAS

var margin = {t:50,r:100,b:50,l:75};
var width = document.getElementById('plot').clientWidth - margin.r - margin.l,
    height = document.getElementById('plot').clientHeight - margin.t - margin.b;

var plot = d3.select('#plot')
    .append('svg')
    .attr('width',width+margin.r+margin.l)
    .attr('height',height + margin.t + margin.b)
    .append('g')
    .attr('class','canvas')
    .attr('transform','translate('+margin.l+','+margin.t+')');


var width2 = document.getElementById('plot2').clientWidth - margin.r - margin.l,
    height2 = document.getElementById('plot2').clientHeight - margin.t - margin.b;

var plot2=d3.select('#plot2')
    .append('svg')
    .attr('width',width2+margin.r+margin.l)
    .attr('height',height2 + margin.t + margin.b)
    .append('g')
    .attr('class','canvas2')
    .attr('transform','translate('+margin.l+','+margin.t+')');


//Formats
var dateFormat = d3.time.format('%Y-%m-%d');
var yearformat = d3.time.format("%Y");
var numberformat = d3.format(",");

// SCALES FIRST GRAPH
var startDate = new Date(2002,1,1),
    endDate = new Date(2015,11,1);
var scaleX = d3.time.scale().domain([startDate,endDate]).range([0, width-5]),
    scaleY = d3.scale.linear().domain([0,2000000]).range([height,0]),
    scaleColorBars = d3.scale.ordinal().range(["#d62d2d","#a12f37","#6c3142","013456","36324c"]);

//Axis1
var axisX1 = d3.svg.axis()
    .scale(scaleX)
    .tickFormat(dateFormat)
    .ticks(d3.time.months)
    .tickSize(5)
    .tickValues(9)
    .orient("bottom");

var axisX2 = d3.svg.axis()
    .scale(scaleX)
    .ticks(d3.time.years, 1)
    .tickFormat(yearformat)
    .tickSize(0)
    .orient("bottom");


var axisY = d3.svg.axis()
    .orient('left')
    .tickSize(-width)
    .scale(scaleY);

//Draw Axis1
plot.append('g')
    .attr('class','axis axis-x')
    .attr('transform','translate(0,'+height+')')
    .call(axisX1);

plot.append('g')
    .attr('class','axis axis-x')
    .attr('transform','translate(0,'+(height+25)+')')
    .call(axisX2);

plot.append('g')
    .attr('class','axis axis-y')
    .call(axisY);


// SCALES SECOND GRAPH
var scaleR = d3.scale.sqrt().domain([0,391835]).range([2,100]),
    scaleColor= d3.scale.ordinal().range(["#9CCB3C","#1E8FCE","#E33425","#8D4098","#F7B219"]);


var radius = Math.min (width2,height2)/2;
var partition =  d3.layout.partition()
    //.sort(function(a,b){return b[13].total - a[13].total})
    .size([2*Math.PI, radius*radius])
    .children (function(d){
    return (d.values);
})
    .value(function(d,i){return d.spaniards}); //d.spaniards?

var arc = d3.svg.arc()
    .startAngle(function(d) { return d.x; })
    .endAngle(function(d) { return d.x + d.dx - 0.01 / (d.depth + 0.5); })
    .innerRadius(function(d) { return Math.sqrt(d.y); })
    .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });


//Import
queue()
    .defer(d3.csv,'/data/spaniards_registered_abroad-CERA.csv',parseData)
    .defer(d3.csv,'/data/spaniards_registered_abroad-CERA_continents-nov.csv',parseDataCont)
    .await(dataLoaded);

//Generators
//
var continent_names = [];
//DataLoaded - nestedData
function dataLoaded (error,data,perCont) {

    //TODO PLOT 1 - EVOLUTION PER YEAR AND CONTINENT STACKED BARS
    //console.log(perCont[0]);
    scaleColor.domain(d3.keys(perCont[0]).filter(function(key) { return key !== "date"; }));

    perCont.forEach(function(d) {
        var y0 = 0;
        d.places = scaleColor.domain().map(function(name) {
            return {name: name, y0: y0, y1: y0 += +d[name],totals: +d[name],month: d.date}; });
        d.totalSpaniards = d.places[d.places.length - 1].y1;
    });
    perCont.sort(function(a, b) {return a.totalSpaniards - b.totalSpaniards});

    plot = plot.append("g").attr("class", "graph1")
        .attr('transform','translate('+5+',0)');

    var graph1 = plot.selectAll(".dates")
        .data(perCont)
        .enter()
        .append("g")
        .attr("class", "dates")
        .attr("transform", function (d) {
            return "translate(" + scaleX(d.date) + ",0)";
        })
        .on("mouseenter", function(d) {
            var tooltip = d3.select(".custom-tooltip");
            tooltip.transition().style("opacity", 1);
            tooltip.select("#total").html(numberformat(d.totalSpaniards));
        })
        .on("mouseleave", function(d){
            d3.select(".custom-tooltip").transition() //hide data from the tooltip
                .style("opacity",0);
        });


    graph1.selectAll(".continents")
        .data(function (d){return d.places})
        .enter()
        .append('rect')
        .attr("class","continents")
        .attr("width", "0px")
        .style('opacity',0.65)
        .attr("y", function (d,i){
            return scaleY(d.y1)})
        .attr("height", 0)
        .on("mouseenter", function(d) {
            d3.select(this).style('opacity', 1);
            var tooltip = d3.select(".custom-tooltip");
            tooltip.transition().style("opacity", 1);
            dateFormat2 = d3.time.format('%B-%Y');
            tooltip.select("#date").html(dateFormat2(d.month));
            tooltip.select("#place").html(d.name);
            tooltip.select("#number1").html(numberformat(d.totals))
        })
        .on("mouseleave", function(d){
            d3.select(this).style('opacity',0.65);
            d3.select(".custom-tooltip").transition()
                .style("opacity",0);
        })

        .on("mousemove", function(d){
            d3.select(this).style('opacity',1);

            var xy = d3.mouse(document.getElementById("plot")); // tooltip to move with mouse movements
            var left = xy[0],
                top = xy[1];
            d3.select(".custom-tooltip")
                .style("left", left+75+ "px")
                .style("top", top +75+ "px")
        })
        .transition()
        .duration(1000)
        .attr("width", "5px")
        .attr("height", function(d){return scaleY(d.y0)-scaleY(d.y1)})
        .style("fill", function (d){
            return scaleColor(d.name)});


    data.sort(function(a, b) { return a.date - b.date || b.spaniards - a.spaniards}); //sort by date, then by spaniards


//TODO PLOT 2
    //nest by year
    var dataMonthOnly = data.filter(function(d){if ((d.month=="November")) {return true}else{return false}});
    console.log(dataMonthOnly);

    var nestedData = d3.nest()
        .key(function (d){return d.year})
        .key(function(d){return d.continent})
        .key(function(d){return d.countryCode})
        .entries(dataMonthOnly);


    nestedData.forEach(function(eachYear) {
            eachYear.values.forEach(function(eachContinent){
                    continent_names.push(eachContinent.key)
                    eachContinent.values.forEach(function(eachCountry){
                            /*spainiards_values = eachCountry.values.map(function(d){
                             return d;
                             }
                             )
                             sum_county = d3.sum(spainiards_values, function(d){
                             return d.spaniards;
                             })
                             eachCountry.total = sum_county;*/



                            eachCountry.total = d3.sum(eachCountry.values.map(function(d){
                                    return d;
                                }
                            ), function(d){
                                return d.spaniards;
                            });
                        }

                    )
                }

            )
        }
    );

    console.log(nestedData);


// I WANT TO DRAW A SUNBURST PARTITION
//    var continent_names = nestedData.map(function(d){return d.values.key})
    console.log(continent_names)
    plot2 = plot2.append("g").attr("class","graph2")
        .attr("transform", "translate(" + width / 2 + "," + height * 0.7 + ")");

    nestedData0 = nestedData[13];
    drawGraph(nestedData0);
    drawText(nestedData0);


    d3.selectAll('.btn').on('click',function(){
        var type = d3.select(this).attr('id');

        if (type=="2002"){
            nestedData2002 = nestedData[0];
            drawGraph(nestedData2002);
            drawText(nestedData2002);

        }if(type=="2003"){
            nestedData2003 = nestedData[1];
            drawGraph(nestedData2003);
            drawText(nestedData2003);
        }if(type=="2004"){
            nestedData2004 = nestedData[2];
            drawGraph(nestedData2004);
            drawText(nestedData2004);
        }if(type=="2005"){
            nestedData2005 = nestedData[3];
            drawGraph(nestedData2005);
            drawText(nestedData2005);
        }if(type=="2006"){
            nestedData2006 = nestedData[4];
            drawGraph(nestedData2006);
            drawText(nestedData2006);
        }if(type=="2007"){
            nestedData2007 = nestedData[5];
            drawGraph(nestedData2007);
            drawText(nestedData2007);
        }if(type=="2008"){
            nestedData2008 = nestedData[6];
            drawGraph(nestedData2008);
            drawText(nestedData2008);
        }if(type=="2009"){
            nestedData2009 = nestedData[7];
            drawGraph(nestedData2009);
            drawText(nestedData2009);
        }if(type=="2010"){
            nestedData2010 = nestedData[8];
            drawGraph(nestedData2010);
            drawText(nestedData2010);
        }if(type=="2011"){
            nestedData2011 = nestedData[9];
            drawGraph(nestedData2011);
            drawText(nestedData2011);
        }if(type=="2012"){
            nestedData2012 = nestedData[10];
            drawGraph(nestedData2012);
            drawText(nestedData2012);
        }if(type=="2013"){
            nestedData2013 = nestedData[11];
            drawGraph(nestedData2013);
            drawText(nestedData2013);
        }if(type=="2014"){
            nestedData2014 = nestedData[12];
            drawGraph(nestedData2014);
            drawText(nestedData2014);
        }if(type=="2015"){
            nestedData2015 = nestedData[13];
            drawGraph(nestedData2015);
            drawText(nestedData2015);
        }
    })
}

function drawGraph (dataArray){
    var graph2 = plot2.datum(dataArray).selectAll("path")
        .data(partition.nodes);

    var graph2T = plot2.datum(dataArray).selectAll(".slicesNames")
        .data(partition.nodes);

    scaleColor.domain(continent_names);

    var graph2Enter= graph2.enter()
        .append("path")
        .attr("class", "partition")
        .attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner ring
        .attr("d", arc)
        .style("stroke", "#fff")
        .style("stroke-width","0.5px")
        .attr("x", function (d) {return (d.x)})
        .attr("y", function (d) { return ((d.y))})
        .style("fill", function(d,i) {
            if(d.depth == 1){ return scaleColor(d.key) } else if (d.depth == 2){return scaleColor(d.parent.key)} else if (d.depth == 3) {return scaleColor(d.parent.parent.key)}
        })
        .style("opacity", 1)
        .each(stash)
        .on("mouseover", mouseover)
        .on("mousemove",mouseover);
    d3.select(".plot2").on("mouseleave", mouseleave);
    graph2.exit().transition().remove();
    graph2
        .transition()
        .duration(1000)
        //.attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner ring
        .attr("d", arc)
        .each(stash)
        .attrTween("d", arcTween);

    var graph2TEnter = graph2T.enter()
        .append("text")
        .attr("class","slicesNames")
        .text(function (d){return d.key})
        .style("font-size", function(d) { if (d.depth==0) {return "14px"}else  if (d.depth==1) {return "14px"}else{return "12px"}})
        .style("fill","#333333")
        .attr("x", function(d){return d[1]})
        // Rotate around the center of the text, not the bottom left corner
        .attr("text-anchor", "middle")
        // First translate to the desired point and set the rotation
        // Not sure what the intent of using this.parentNode.getBBox().width was here (?)
        .attr("transform", function(d) { if (d.depth==0) {return "translate (0,0)"}else{return "translate(" + arc.centroid(d) + ")" + "rotate(" + getAngle(d) + ")"; }})
        .attr("dx", "6") // margin
        .attr("dy", ".35em") // vertical-align
        .text(function(d){return d[2]})
        .attr("pointer-events","none");



    //totalSPA = path.node().__data__.value;

    //exit

    graph2T.exit().transition().remove();

//update

    graph2T
        .transition()
        .text(function (d){return d.key})
        .attr("transform", function(d) { if (d.depth==0) {return "translate (0,0)"}else{return "translate(" + arc.centroid(d) + ")" + "rotate(" + getAngle(d) + ")"; }})
        .attr("dx", "6") // margin
        .attr("dy", ".35em") // vertical-align
        .text(function(d){return d[2]})
        .attr("pointer-events","none");
}

function drawText (dataArray){}
    /*    var graph2 = plot2.datum(dataArray).selectAll("text")
        .data(partition.nodes);

    scaleColor.domain(continent_names);

    var graph2Enter= graph2.enter()
        .append("text")
        .attr("class", "partition")
        .style("font-size", function(d) { if (d.depth==0) {return "14px"}else  if (d.depth==1) {return "14px"}else{return "12px"}})
        .style("fill","#333333")
        .attr("x", function(d){return d[1]})
        // Rotate around the center of the text, not the bottom left corner
        .attr("text-anchor", "middle")
        // First translate to the desired point and set the rotation
        // Not sure what the intent of using this.parentNode.getBBox().width was here (?)
        .attr("transform", function(d) { if (d.depth==0) {return "translate (0,0)"}else{return "translate(" + arc.centroid(d) + ")" + "rotate(" + getAngle(d) + ")"; }})
        .attr("dx", "6") // margin
        .attr("dy", ".35em") // vertical-align
        .text(function(d){return d[2]})
        .attr("pointer-events","none");

    d3.select(".plot2").on("mouseleave", mouseleave);

    //exit
    graph2.exit().transition().remove();

//update
    graph2
        .transition()
        .duration(1000)
        //.attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner ring
    d3.selectAll("text")
        .text(function (d){return d.key})
        .attr("transform", function(d) { if (d.depth==0) {return "translate (0,0)"}else{return "translate(" + arc.centroid(d) + ")" + "rotate(" + getAngle(d) + ")"; }})
        .attr("dx", "6") // margin
        .attr("dy", ".35em") // vertical-align
        .text(function(d){return d[2]})
        .attr("pointer-events","none");
}*/
function getAngle(d) {
    // Offset the angle by 90 deg since the '0' degree axis for arc is Y axis, while
    // for text it is the X axis.
    var thetaDeg = (180 / Math.PI * (arc.startAngle()(d) + arc.endAngle()(d)) / 2 - 90);
    // If we are rotating the text by more than 90 deg, then "flip" it.
    // This is why "text-anchor", "middle" is important, otherwise, this "flip" would
    // a little harder.
    return (thetaDeg > 90) ? thetaDeg - 180 : thetaDeg;
}

// Stash the old values for transition.
function stash(d) {
    d.x0 = d.x;
    d.dx0 = d.dx;
}

// Interpolate the arcs in data space.
function arcTween(a) {
    var i = d3.interpolate({x: a.x0, dx: a.dx0}, a);
    return function(t) {
        var b = i(t);
        a.x0 = b.x;
        a.dx0 = b.dx;
        return arc(b);
    };
}
function mouseover(d) {

    /*var percentage = (100 * d.value / totalSPA).toPrecision(3);
     var percentageString = percentage + "%";
     if (percentage < 0.1) {
     percentageString = "< 0.1%";
     }
     d3.select("#percentage")
     .text(percentageString);*/

    // Fade all the segments.
    d3.selectAll("path")
        .style("opacity", 0.5);
    var sequenceArray = getAncestors(d);
    // Then highlight only those that are an ancestor of the current segment.
    //d3.select(this).style("opacity",1)
    d3.selectAll("path")
        .filter(function(node) {
            return (sequenceArray.indexOf(node) >= 0);
        })
        .style("opacity", 1);
}

// Fade all but the current sequence
// Restore everything to full opacity when moving off the visualization.
function mouseleave(d) {
 // Deactivate all segments during transition.
 d3.selectAll("path").on("mouseover", null);

 // Transition each segment to full opacity and then reactivate it.
 d3.selectAll("path")
 .transition()
 .duration(1000)
 .style("opacity", 1)
 .each("end", function() {
 d3.select(this).on("mouseover", mouseover);
 });

 }

// Given a node in a partition layout, return an array of all of its ancestor
// nodes, highest first, but excluding the root.
function getAncestors(node) {
    var path = [];
    var current = node;
    while (current.parent) {
        path.unshift(current);
        current = current.parent;
    }
    return path;
}



//PARSE
function parseData (d) {


    return {
        year: +d["Year"],
        month: d["Month"],
        date: new Date (d["Date"]),
        continent: d["Continent"],
        country: d["Country of residence"],
        countryCode: d["Code"],
        consulate: d["Consulate"],
        spaniards: +d["Spaniards"],
    };
}

function parseDataCont (c) {
    //console.log(c)

    return {
        date: new Date (c["Date"]),
        America: +c["America"],
        Europe: +c["Europe"],
        Asia: +c["Asia"],
        Africa: +c["Africa"],
        Oceania: +c["Oceania"],
    };
}