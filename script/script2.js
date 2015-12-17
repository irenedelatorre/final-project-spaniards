// TODO CANVAS 1

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

//Formats
var dateFormat = d3.time.format('%Y-%m-%d');
var yearformat = d3.time.format("%Y");
var numberformat = d3.format(",");
var percentage = d3.format("%");
// Scales
var startDate = new Date(2002,1,1),
    endDate = new Date(2015,11,1);
var scaleX = d3.time.scale().domain([startDate,endDate]).range([0, width-5]),
    scaleY = d3.scale.linear().domain([0,2000000]).range([height,0]),
    scaleColorBars = d3.scale.ordinal().range(["#9CCB3C","#1E8FCE","#8D4098","#F7B219","#E33425"]);

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

// draw legend
legendData = [{color:"#9CCB3C", country:"America"},{color:"#1E8FCE",country:"Europe"},{color:"#8D4098",country:"Asia"}, {color:"#E33425", country:"Oceania"},{color:"#F7B219", country:"Africa"}];

var legend = d3.select('#legend1').append('svg')
    .attr('width',width+margin.r+margin.l)
    .append("g")
    .attr("class","legend")
    .selectAll('.legendElement').data(legendData).enter();

legend
    .append('rect').attr('class', 'legendElement')
    .attr('x', function(d,i){ return i * 100;})
    .attr('y', 15)
    .attr('width', '15px')
    .attr('height','15px')
    .style('fill', function (d) {
        console.log(d);
        return d.color;
    });
legend.append("text")
    .attr('class', 'legendElement')
    .text(function (d){return d.country})
    .attr("x", function(d,i){return 27+(i*100)})
    .attr('y', 27);

// TODO CANVAS - 2
var width2 = document.getElementById('plot2').clientWidth - margin.r - margin.l,
    height2 = document.getElementById('plot2').clientHeight - margin.t - margin.b;

var plot2=d3.select('#plot2')
    .append('svg')
    .attr('width',width2+margin.r+margin.l)
    .attr('height',height2 + margin.t + margin.b)
    .append('g')
    .attr('class','canvas2')
    .attr('transform','translate('+margin.l+','+margin.t+')');

// draw legend
var legend2 = d3.select('#legend2').append('svg')
    .attr('width',width+margin.r+margin.l)
    .append("g")
    .attr("class","legend")
    .selectAll('.legendElement').data(legendData).enter();

legend2
    .append('circle').attr('class', 'legendElement')
    .attr('cx', function(d,i){ return 7+(i * 100);})
    .attr('cy', 15)
    .attr('r', '7px')
    .style('fill', function (d) {
        console.log(d);
        return d.color;
    });
legend2.append("text")
    .attr('class', 'legendElement')
    .text(function (d){return d.country})
    .attr("x", function(d,i){return 27+(i*100)})
    .attr('y', 19);

// Scales
    scaleColor= d3.scale.ordinal().range(["#9CCB3C","#1E8FCE","#E33425","#8D4098","#F7B219"]);
    scaleColorStroke= d3.scale.ordinal().range(["#5D7A23","#105176","#801C14","#451F4B","#996D0C"]);
    scaleOpacity = d3.scale.linear().domain([0,.7]).range([.10,1]);
    scaleOpacity2 = d3.scale.linear().domain([-.1,0]).range([1,.10]);

// Sunburst layout
var radius = Math.min (width2,height2)/2;
var partition =  d3.layout.partition()
    //.size([2*Math.PI, radius*radius])
    .children (function(d){return (d.values);})
    .value(function(d,i){return d.spaniards});

var arc = d3.svg.arc()
    .startAngle(function(d) { return d.x; })
    .endAngle(function(d) { return d.x + d.dx - 0.01 / (d.depth + 0.5); })
    .innerRadius(function(d) { return Math.sqrt(d.y); })
    .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });

//IMPORT DATASETS
queue()
    .defer(d3.csv,'/data/spaniards_registered_abroad-CERA.csv',parseData)
    .defer(d3.csv,'/data/spaniards_registered_abroad-CERA_continents-nov.csv',parseDataCont)
    .await(dataLoaded);

var continent_names = [];


//DataLoaded - nestedData
function dataLoaded (error,data,perCont) {

    //TODO PLOT 1 - EVOLUTION PER YEAR AND CONTINENT STACKED BARS

    scaleColor.domain(d3.keys(perCont[0]).filter(function(key) { return key !== "date"; }));

    perCont.forEach(function(d) {
        var y0 = 0;
        d.places = scaleColor.domain().map(function(name) {return {name: name, y0: y0, y1: y0 += +d[name],totals: +d[name],month: d.date}; });
        d.totalSpaniards = d.places[d.places.length - 1].y1;
    });
    perCont.sort(function(a, b) {return a.totalSpaniards - b.totalSpaniards});

    plot = plot.append("g").attr("class", "graph1").attr('transform','translate('+5+',0)');

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
        .attr("data-legend",function(d) { return d.places})
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
                .style("left", left+50+ "px")
                .style("top", top +400+ "px")
        })

        .transition()
        .duration(1000)
        .attr("width", "5px")
        .attr("height", function(d){return scaleY(d.y0)-scaleY(d.y1)})
        .style("fill", function (d){
            return scaleColorBars(d.name)});

    data.sort(function(a, b) { return a.date - b.date || b.spaniards - a.spaniards}); //sort by date, then by spaniards


//TODO PLOT 2
    //nest by year
    var dataMonthOnly = data.filter(function(d){if ((d.month=="November")) {return true}else{return false}});
    //console.log(dataMonthOnly);

    var nestedData = d3.nest()
        .key(function (d){return d.year})
        .key(function(d){return d.continent})
        .key(function(d){return d.countryCode})
        .entries(dataMonthOnly);

    // Return data for each country. Needed it in order to be able to do the sunburst
    nestedData.forEach(function(eachYear) {
            eachYear.values.forEach(function(eachContinent){
                    continent_names.push(eachContinent.key);
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
                            })
                        }

                    )
                }

            )
        }
    );


// Sunburst Diagram

    plot2 = plot2.append("g").attr("class","graph2")
        .attr("transform", "translate(" + width / 2 + "," + height  + ")");

    nestedData0 = nestedData[13];
    drawGraph(nestedData0);



    d3.selectAll('.btn').on('click',function(){
        var notes = d3.select("#notes");
        var type = d3.select(this).attr('id');
        if (type=="2002"){
            nestedData2002 = nestedData[0];
            drawGraph(nestedData2002);
            notes.text("First year with data, all year variations are 0%. Most of the old soviet countries still have their consulate in Moscow.")
        .select("#yearVariation").style("opacity",1);
        }if(type=="2003"){
            nestedData2003 = nestedData[1];
            drawGraph(nestedData2003);
            notes.text("")
        }if(type=="2004"){
            nestedData2004 = nestedData[2];
            drawGraph(nestedData2004);
            notes.text("")
        }if(type=="2005"){
            nestedData2005 = nestedData[3];
            drawGraph(nestedData2005);
            notes.text("")
        }if(type=="2006"){
            nestedData2006 = nestedData[4];
            drawGraph(nestedData2006);
            notes.text("")
        }if(type=="2007"){
            nestedData2007 = nestedData[5];
            drawGraph(nestedData2007);
            notes.text("")
        }if(type=="2008"){
            nestedData2008 = nestedData[6];
            drawGraph(nestedData2008);
            notes.text("Beginning of the economic crisis in Spain")
        }if(type=="2009"){
            nestedData2009 = nestedData[7];
            drawGraph(nestedData2009);
            notes.text("")
        }if(type=="2010"){
            nestedData2010 = nestedData[8];
            drawGraph(nestedData2010);
            notes.text("")
        }if(type=="2011"){
            nestedData2011 = nestedData[9];
            drawGraph(nestedData2011);
            notes.text("As a result of the closure of Manchester's consulate, the one in Edinburgh has 250% more Spaniards registered in its territory. In September 2011, Hannover's consulate also closes (5,616 Spaniards registered in July), which might explain the high year variation of spaniards registered in Hamburg.")
        }if(type=="2012"){
            nestedData2012 = nestedData[10];
            drawGraph(nestedData2012);
            notes.text("")
        }if(type=="2013"){
            nestedData2013 = nestedData[11];
            drawGraph(nestedData2013);
            notes.text("")
        }if(type=="2014"){
            nestedData2014 = nestedData[12];
            drawGraph(nestedData2014);
            notes.text("")
        }if(type=="2015"){
            nestedData2015 = nestedData[13];
            drawGraph(nestedData2015);
            notes.text("")
        }
    })
}

function drawGraph (dataArray){
    var nodes = partition.nodes(dataArray)
        .filter(function(d) {
            return (d.dx > 0.00001); // 0.005 radians = 0.29 degrees
        });

    var graph2 = plot2.datum(dataArray)
        .selectAll("path")
        .data(nodes);

    scaleColor.domain(continent_names);
    scaleColorStroke.domain(continent_names);

    var graph2Enter= graph2.enter()
        .append("path")
        .attr("class", "partition")
        .attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner ring
        .attr("d", arc)
        .style("stroke", "#fff")
        .style("stroke-width","0.5px")
        .attr("x", function (d) {return (d.x)})
        .attr("y", function (d) { return ((d.y))})
        .style("fill",function(d,i) {
            if(d.depth == 1){ return scaleColor(d.key)
            }else if (d.depth == 2){return scaleColor(d.parent.key)
            }else if (d.depth == 3 && d.variation>=0) {return scaleColor(d.parent.parent.key)
            }else if (d.depth == 3 && d.variation<0){return "#ababab"}
        })
        .style("opacity", function(d){ if (d.depth == 3&& d.variation>=0) {return scaleOpacity(d.variation)}else if (d.depth == 3 && d.variation<0){return scaleOpacity2(d.variation)}})
        .each(stash)
        .on("mouseover", function(d,i){
            //console.log(d,i);
            var tooltip2 = d3.select("#explanationSunburst");
            tooltip2.transition().style("opacity", 1);
            var this_key = d.key;
            var thisD = d;
            if (d.depth==1){tooltip2.select("#where").text(function (d,i){
                //console.log(nodes[i].key);
                console.log(d,nodes);
                continentName=this_key;
                return continentName})}
            else if (d.depth==2){tooltip2.select("#where").text(function (d,i){
                //console.log(thisD.children[i].country)
                countryName = (thisD.children[i].country);
                return countryName});
                tooltip2.select("#yearVariation").style("opacity",0);
                tooltip2.select("#variation").text(function (d,i){
                    yearVariation=(thisD["variation"]);
                    return " "});
            }
            else if (d.depth==3){
                tooltip2.select("#where").text(function (d,i){
                //console.log(this_key)
                consulateName=(thisD["consulate"]);
                return consulateName} );
                tooltip2.select("#yearVariation").style("opacity",1);
                tooltip2.select("#variation").text(function (d,i){
                    yearVariation=(thisD["variation"]);
                    return percentage(yearVariation)});
                };
            return mouseover;
        })
        .on("mousemove",mouseover);

    d3.select(".canvas2").on("mouseleave",mouseleave);

    //exit
    graph2.exit().transition().remove();

    totalSPA = graph2.node().__data__.value;

    //size of sunburst changes with total number per year
    partition.size([2*Math.PI, (totalSPA/(radius/36))]);

    //update
    graph2
        .transition()
        .duration(0)//.If on, transformation affects to 'new' areas created (areas that were already there, but were created as new because of the size in the diagram)
        .each(stash)
        .attrTween("d", arcTween)
        .style("fill",function(d,i) {
            if(d.depth == 1){ return scaleColor(d.key)
            }else if (d.depth == 2){return scaleColor(d.parent.key)
            }else if (d.depth == 3 && d.variation>=0) {return scaleColor(d.parent.parent.key)
            }else if (d.depth == 3 && d.variation<0){return "#ababab"}
        })
        .style("opacity", function(d){ if (d.depth == 3&& d.variation>=0) {return scaleOpacity(d.variation)}else if (d.depth == 3 && d.variation<0){return scaleOpacity2(d.variation)}})
        ;


    //TEXT
    // For efficiency, filter nodes to keep only those large enough to read.
    var nodes2 = partition.nodes(dataArray)
        .filter(function(d) {
            return (d.dx > 0.03);
        });

    var text = plot2.datum(dataArray)
        .selectAll("text")
        .data(nodes2);

    var textEnter = text.enter()
        .append("text")
        .attr("class",function (d) {if (d.depth==0) {return "title slicesNames"}else{return "slicesNames"}})
        .text(function (d){return d.key})
        .attr("x", function(d){return d[1]})
        // Rotate around the center of the text, not the bottom left corner
        // First translate to the desired point and set the rotation
        .attr("transform", function(d) { if (d.depth==0) {return "translate (0,0)"}else{return "translate(" + arc.centroid(d) + ")" + "rotate(" + getAngle(d) + ")"; }})
        .attr("dx", "6") // margin
        .attr("dy", ".35em") // vertical-align
        .style("fill", "#fff");
//exit
    text.exit().transition().remove();

    text
        //.transition() //Currently not on because element positions are built depending on the size of slices (slice number 3 may be slice number 5)
        //.duration(1000)
        .text(function(d) {return d.key})
        .attr("x", function(d){return d[1]})
        .attr("dx", "6") // margin
        .attr("dy", ".35em")
        .attr("transform", function(d) { if (d.depth==0) {return "translate (0,0)"}else{return "translate(" + arc.centroid(d) + ")" + "rotate(" + getAngle(d) + ")"; }});// vertical-align;
}

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

function mouseover(d,dataArray) {

    var percentage = (100 * d.value / totalSPA).toPrecision(3);
    var totalPlace = d.value;
    var percentageString = percentage + "%";if (percentage < 0.1) {percentageString = "< 0.1%";}

    d3.select("#percentage").text((percentageString));
    d3.select("#total2").text(numberformat(totalSPA));
    d3.select("#totalWhere").text(numberformat(totalPlace));

    var sequenceArray = getAncestors(d);

    d3.select("#explanationSunburst")
        .style("visibility", "");

    // All the elements in the initial state
    d3.selectAll("path")
        .style("stroke-width","0.5px")
        .style("fill",function(d,i) {
            if(d.depth == 1){ return scaleColor(d.key)
            }else if (d.depth == 2){return scaleColor(d.parent.key)
            }else if (d.depth == 3 && d.variation>=0) {return scaleColor(d.parent.parent.key)
            }else if (d.depth == 3 && d.variation<0){return "#ababab"}
        })
    ;

    // Then highlight only those that are an ancestor of the current segment.
    d3.selectAll("path")
        .filter(function(node) {
            return (sequenceArray.indexOf(node) >= 0);
        })
        .style("fill",function(d,i) {
            if(d.depth == 1){ return scaleColorStroke(d.key)
            }else if (d.depth == 2){return scaleColorStroke(d.parent.key)
            }else if (d.depth == 3 && d.variation>=0) {return scaleColorStroke(d.parent.parent.key)
            }else if (d.depth == 3 && d.variation<0){return "#999"}
        });

    d3.selectAll(".slicesNames")
    .style("font-weight","300");

    d3.selectAll("text")
        .filter(function(node) {
            return (sequenceArray.indexOf(node) >= 0);
        })
        .style("font-weight","700");

}


// Fade all but the current sequence
// Restore everything to full opacity when moving off the visualization.
function mouseleave(d) {
     d3.select("#explanationSunburst").style("visibility", "hidden");
 // Transition each segment to full opacity and then reactivate it.
 d3.selectAll("path")
 .transition()
 .duration(50)
     .style("stroke-width","0.5px")
     .style("fill",function(d,i) {
         if(d.depth == 1){ return scaleColor(d.key)
         }else if (d.depth == 2){return scaleColor(d.parent.key)
         }else if (d.depth == 3 && d.variation>=0) {return scaleColor(d.parent.parent.key)
         }else if (d.depth == 3 && d.variation<0){return "#ababab"}
     });

d3.selectAll(".slicesNames")
    .transition()
    .duration(50)
    .style("fill", "#fff")
    .style("font-weight","300");

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
        variation:(+d["Variation"])
    };
}

function parseDataCont (c) {
    return {
        date: new Date (c["Date"]),
        America: +c["America"],
        Europe: +c["Europe"],
        Asia: +c["Asia"],
        Africa: +c["Africa"],
        Oceania: +c["Oceania"],
    };
}