/*James Gunby - B00713142*/
/*CSCI4166 Final Project*/
/*This JS file creates the two maps displayed in the tool.*/

let data = [];
let globalData =[];

const projection = d3.geoMercator();
const pathGenerator = d3.geoPath().projection(projection);

const leftSvg = d3.select("#leftMap");
const rightSvg = d3.select("#rightMap");

let leftPaths;
let rightPaths;

const yearRange = [];
let yearToAdd = 1920;
while (yearToAdd <= 2015) {
    yearRange.push("" + yearToAdd);
    yearToAdd++;
}

const leftHoverOverArea = d3.select("#leftHoveredCountry")
    .append("svg")
    .attr("width", 350)
    .attr("height", 50)
    .append("text")
    .attr("class", "hoveredCountryText")
    .attr("transform", "translate(0, 35)");

let leftCountrySelected;
const leftSelectedArea = d3.select("#leftSelectionArea")
    .append("svg")
    .attr("width", 700)
    .attr("height", 100);
leftSelectedArea
    .append("text")
    .attr("id", "leftSelectedCountryName")
    .attr("class", "hoveredCountryText")
    .attr("width", 350)
    .attr("transform", "translate(0, 35)");
leftSelectedArea
    .append("text")
    .attr("id", "leftSelectedCountryTemp")
    .attr("class", "hoveredCountryText")
    .attr("width", 350)
    .attr("transform", "translate(350,35)");
leftSelectedArea
    .append("text")
    .attr("id", "leftGlobalAvgTemp")
    .attr("class", "hoveredCountryText")
    .attr("width", 700)
    .attr("transform", "translate(0, 65)");

let rightCountrySelected;
const rightHoverOverArea = d3.select("#rightHoveredCountry")
    .append("svg")
    .attr("width", 350)
    .attr("height", 50)
    .append("text")
    .attr("class", "hoveredCountryText")
    .attr("transform", "translate(0, 35)");

const rightSelectedArea = d3.select("#rightSelectionArea")
    .append("svg")
    .attr("width", 700)
    .attr("height", 100);
rightSelectedArea
    .append("text")
    .attr("id", "rightSelectedCountryName")
    .attr("class", "hoveredCountryText")
    .attr("width", 350)
    .attr("transform", "translate(0, 35)");
rightSelectedArea
    .append("text")
    .attr("id", "rightSelectedCountryTemp")
    .attr("class", "hoveredCountryText")
    .attr("width", 350)
    .attr("transform", "translate(350,35)");
rightSelectedArea
    .append("text")
    .attr("id", "rightGlobalAvgTemp")
    .attr("class", "hoveredCountryText")
    .attr("width", 750)
    .attr("transform", "translate(0, 65)");

const colours = d3.scaleLinear()
    .domain([1, 10, 20])
    .range(["#0d08ad","#ffffff", "#7e0e1b"]);

d3.json("/GlobalLandTemperaturesByCountryReduced.json").then((readData) => {
   data = readData;
   console.log(data);
   d3.json("/GlobalTemperaturesReduced.json").then((readGlobalData) => {
       globalData = readGlobalData;

       d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json").then((worldData) => {
            const countries = topojson.feature(worldData, worldData.objects.countries);

            //The world map topoJSON components form the left map.
            leftPaths = leftSvg.selectAll("path").data(countries.features);
            leftPaths.enter().append("path")
                .attr("d", (d) => {
                    return pathGenerator(d);
                })
                .attr("id", (d) => {
                    const countryName = d.properties.name.replace(/\s./g, "");
                    return countryName + "LeftPath";
                })
                .attr("stroke", "black")
                .attr("fill", "#757575")
                .attr("transform", "scale(0.7, 1)");

           //The world map topoJSON components form the left map.
            rightPaths = rightSvg.selectAll("path").data(countries.features);
            rightPaths.enter().append("path")
                .attr("d", (d) => {
                    return pathGenerator(d);
                })
                .attr("id", (d) => {
                    const countryName = d.properties.name.replace(/\s./g, "");
                    return countryName + "RightPath";
                })
                .attr("stroke", "black")
                .attr("fill", "#757575")
                .attr("transform", "scale(0.7, 1)");

            updateLeftMap();
            updateRightMap();
        });
    });
});

renderLegend();

//Updates the left map whenever the use interacts with it or makes data changes.
function updateLeftMap() {
    if (leftPaths !== undefined) {
        const yearSelector = document.getElementById("leftWorldYearSelect");
        const year = yearSelector.options[yearSelector.selectedIndex].value;
        const monthSelector = document.getElementById("leftWorldMonthSelect");
        const month = monthSelector.options[monthSelector.selectedIndex].value;
        const monthAsNumber = moment().month(month).format("MM");
        const monthAsNumberSingle = moment().month(month).format("M");
        const filteredData = data.filter((row) => {
            //Sometimes d3 converts the dates from MM/DD/YYYY to YYYY-MM-DD automatically but other times it doesn't.
            //Additional check is added for either case.
            return row.dt.includes(year) && (row.dt.includes(`-${monthAsNumber}-01`)
            || row.dt.startsWith(`${monthAsNumberSingle}/1/`));
        });

        //Updates the displayed global average temperature if the user changes month or year and a country
        //was selected previously.
        if (leftCountrySelected) {
            const currentData = getCountryData(filteredData, leftCountrySelected.d);
            d3.select("#leftSelectedCountryTemp")
                .text(() => {
                    if (currentData === undefined) {
                        return "No data for this region.";
                    }
                    return "" + month + " " + year + ": " + parseInt(currentData.AverageTemperature) + "°C";
                });
        }

        //Updates the displayed global average temperature if the user changes month or year.
        d3.select("#leftGlobalAvgTemp")
            .text(() => {
                const globalAvg = globalData.filter((row) => {
                    return ((row.dt.includes(year) && row.dt.includes(`-${monthAsNumber}-01`))
                        || (row.dt.includes(year) && row.dt.startsWith(`${monthAsNumberSingle}/1/`)));
                });
                return "" + month + " " + year + " Global Avg: " + parseFloat(globalAvg[0].LandAverageTemperature).toFixed(2) + "°C";
            });

        leftSvg.selectAll("path")
            .attr("fill", (d) => {
                const countryData = getCountryData(filteredData, d);
                if (countryData === undefined) {
                    return "#757575";
                }
                //Fills country with appropriate temperature colour.
                return colours(getDomain(parseFloat(countryData.AverageTemperature)));
            })
            .on("mouseover", (d) => {
                //Highlights the moused-over country, and its corresponding temperature in the legend.
                const countryData = getCountryData(filteredData, d);
                leftHoverOverArea.text(d.properties.name);
                if (countryData !== undefined) {
                    const domain = (getDomain(parseFloat(countryData.AverageTemperature)));
                    d3.select("#map" + domain)
                        .transition()
                        .duration(200)
                        .attr("stroke", "black")
                        .attr("stroke-width", "4px");
                }
                const countryName = d.properties.name.replace(/\s./g, "");
                d3.select("#" + countryName + "LeftPath")
                    .attr("stroke-width", "3px");
            })
            .on("mouseleave", (d) => {
                //Removes highlight of country (unless it is selected) and around the legend.
                const countryData = getCountryData(filteredData, d);
                leftHoverOverArea.text("");
                if (countryData !== undefined) {
                    const domain = (getDomain(parseFloat(countryData.AverageTemperature)));
                    d3.select("#map" + domain)
                        .transition()
                        .duration(200)
                        .attr("stroke", "black")
                        .attr("stroke-width", "0");
                }
                if (leftCountrySelected === undefined || leftCountrySelected.d !== d) {
                    const countryName = d.properties.name.replace(/\s./g, "");
                    d3.select("#" + countryName + "LeftPath")
                        .attr("stroke-width", "1px");
                }
            })
            .on("click", (d) => {
                if (leftCountrySelected === undefined || leftCountrySelected.d !== d) {
                    const countryData = getCountryData(filteredData, d);
                    d3.select("#leftSelectedCountryName")
                        .text(d.properties.name);
                    d3.select("#leftSelectedCountryTemp")
                        .text(() => {
                            if (countryData === undefined) {
                                return "No data for this region.";
                            }
                            return "" + month + " " + year + ": " + parseInt(countryData.AverageTemperature) + "°C";
                        });
                    if (leftCountrySelected !== undefined) {
                        const countryName = leftCountrySelected.d.properties.name.replace(/\s./g, "");
                        d3.select("#" + countryName + "LeftPath")
                            .attr("stroke-width", "1px");
                    }
                    if (countryData !== undefined) {
                        leftCountrySelected = {
                            month,
                            year,
                            d,
                            temp: parseInt(countryData.AverageTemperature) + "°C"
                        }
                    }
                } else {
                    d3.select("#leftSelectedCountryName")
                        .text("");
                    d3.select("#leftSelectedCountryTemp")
                        .text("");
                    leftCountrySelected = undefined;
                    const countryName = d.properties.name.replace(/\s./g, "");
                    d3.select("#" + countryName + "LeftPath")
                        .attr("stroke-width", "1px");
                }
            });
    }
}

//Updates the right map whenever the user makes changes.
function updateRightMap() {
    if (rightPaths !== undefined) {
        const yearSelector = document.getElementById("rightWorldYearSelect");
        const year = yearSelector.options[yearSelector.selectedIndex].value;
        const monthSelector = document.getElementById("rightWorldMonthSelect");
        const month = monthSelector.options[monthSelector.selectedIndex].value;
        const monthAsNumber = moment().month(month).format("MM");
        const monthAsNumberSingle = moment().month(month).format("M");
        const filteredData = data.filter((row) => {
            return row.dt.includes(year) && (row.dt.includes(`-${monthAsNumber}-01`)
            || row.dt.startsWith(`${monthAsNumberSingle}/1/`));
        });

        if (rightCountrySelected) {
            const currentData = getCountryData(filteredData, rightCountrySelected.d);
            d3.select("#rightSelectedCountryTemp")
                .text(() => {
                    if (currentData === undefined) {
                        return "No data for this region.";
                    }
                    return "" + month + " " + year + ": " + parseInt(currentData.AverageTemperature) + "°C";
                });
        }

        d3.select("#rightGlobalAvgTemp")
            .text(() => {
                const globalAvg = globalData.filter((row) => {
                    return ((row.dt.includes(year) && row.dt.includes(`-${monthAsNumber}-01`))
                        || (row.dt.includes(year) && row.dt.startsWith(`${monthAsNumberSingle}/1/`)));
                });
                return "" + month + " " + year + " Global Avg: " + parseFloat(globalAvg[0].LandAverageTemperature).toFixed(2) + "°C";
            });

        rightSvg.selectAll("path")
            .attr("fill", (d) => {
                const countryData = getCountryData(filteredData, d);
                if (countryData === undefined) {
                    return "#757575";
                }
                return colours(getDomain(parseFloat(countryData.AverageTemperature)));
            })
            .on("mouseover", (d) => {
                const countryData = getCountryData(filteredData, d);
                rightHoverOverArea.text(d.properties.name);
                if (countryData !== undefined) {
                    const domain = (getDomain(parseFloat(countryData.AverageTemperature)));
                    d3.select("#map" + domain)
                        .transition()
                        .duration(200)
                        .attr("stroke", "black")
                        .attr("stroke-width", "4px");
                }
                const countryName = d.properties.name.replace(/\s./g, "");
                d3.select("#" + countryName + "RightPath")
                    .attr("stroke-width", "3px");
            })
            .on("mouseleave", (d) => {
                const countryData = getCountryData(filteredData, d);
                rightHoverOverArea.text("");
                if (countryData !== undefined) {
                    const domain = (getDomain(parseFloat(countryData.AverageTemperature)));
                    d3.select("#map" + domain)
                        .transition()
                        .duration(200)
                        .attr("stroke", "black")
                        .attr("stroke-width", "0");
                }
                if (rightCountrySelected === undefined || rightCountrySelected.d !== d) {
                    const countryName = d.properties.name.replace(/\s./g, "");
                    d3.select("#" + countryName + "RightPath")
                        .attr("stroke-width", "1px");
                }
            })
            .on("click", (d) => {
                if (rightCountrySelected === undefined || rightSelectedArea.d !== d) {
                    const countryData = getCountryData(filteredData, d);
                    d3.select("#rightSelectedCountryName")
                        .text(d.properties.name);
                    d3.select("#rightSelectedCountryTemp")
                        .text(() => {
                            if (countryData === undefined) {
                                return "No data for this region.";
                            }
                            return "" + month + " " + year + ": " + parseInt(countryData.AverageTemperature) + "°C";
                        });
                    if (rightCountrySelected !== undefined) {
                        const countryName = rightCountrySelected.d.properties.name.replace(/\s./g, "");
                        d3.select("#" + countryName + "RightPath")
                            .attr("stroke-width", "1px");
                    }
                    if (countryData !== undefined) {
                        rightCountrySelected = {
                            month,
                            year,
                            d,
                            temp: parseInt(countryData.AverageTemperature) + "°C"
                        }
                    }
                } else {
                    d3.select("#rightSelectedCountryName")
                        .text("");
                    d3.select("#rightSelectedCountryTemp")
                        .text("");
                    rightCountrySelected = undefined;
                    const countryName = d.properties.name.replace(/\s./g, "");
                    d3.select("#" + countryName + "RightPath")
                        .attr("stroke-width", "1px");
                }
            });
    }
}

//Compares the current row in the country path data to the country temperature data, and pulls returns the appropriate row.
function getCountryData(filteredData, d) {
    return filteredData.find(row => row.Country === d.properties.name
        || (row.Country.includes("United States") && d.properties.name.includes("United States"))
        || (row.Country.includes("Democratic Republic") && d.properties.name.includes("Dem. Rep."))
        || (row.Country.includes("Central African") && d.properties.name.includes("Central African"))
        || (row.Country.includes("Somali") && d.properties.name.includes("Somali"))
    );
}

//Returns the temperature domain to determine colour needing to be used.
function getDomain(temperature) {
    if (temperature <= -45.0) {
        return 1;
    }
    if (-45.0 <= temperature && temperature < -40.0) {
        return 2;
    }
    if (-40.0 <= temperature && temperature < -35.0) {
        return 3;
    }
    if (-35.0 <= temperature && temperature < -30.0) {
        return 4;
    }
    if (-30.0 <= temperature && temperature < -25.0) {
        return 5;
    }
    if (-25.0 <= temperature && temperature < -20.0) {
        return 6;
    }
    if (-20.0 <= temperature && temperature < -15.0) {
        return 7;
    }
    if (-15.0 <= temperature && temperature < -10.0) {
        return 8;
    }
    if (-10.0 <= temperature && temperature < -5.0) {
        return 9;
    }
    if (-5.0 <= temperature && temperature < 0.0) {
        return 10;
    }
    if (0 <= temperature && temperature < 5.0) {
        return 11;
    }
    if (5.0 <= temperature && temperature < 10.0) {
        return 12;
    }
    if (10.0 <= temperature && temperature < 15.0) {
        return 13;
    }
    if (15.0 <= temperature && temperature < 20.0) {
        return 14;
    }
    if (20.0 <= temperature && temperature < 25.0) {
        return 15;
    }
    if (25.0 <= temperature && temperature < 30.0) {
        return 16;
    }
    if (30.0 <= temperature && temperature < 35.0) {
        return 17;
    }
    if (35.0 <= temperature && temperature < 40.0) {
        return 18;
    }
    if (40.0 <= temperature && temperature < 45.0) {
        return 19;
    }
    if (45.0 <= temperature) {
        return 20;
    }
}

//Renders the legend between the maps.
function renderLegend() {
    const legendSVG = d3.select("#mapLegend").append("svg")
        .attr("width", 84)
        .attr("height", 700)
        .attr("transform", "translate(10, 100)");

    const domains = getDomainData();

    legendSVG.selectAll("rects")
        .data(domains)
        .enter()
        .append("rect")
        .attr("id", (d) => {
            return "map" + d.domain;
        })
        .attr("width", 80)
        .attr("height", 20)
        .attr("fill", (d) => {
            return (colours(d.domain));
        })
        .attr("transform", (d, i) => {
            return "translate(0," + i * 25 + ")";
        });

    legendSVG.selectAll("text")
        .data(domains)
        .enter()
        .append("text")
        .attr("fill", (d) => {
            if (d.domain >= 6 && d.domain <= 15) {
                return "#000000";
            }
            return "#ffffff";
        })
        .text((d) => {
            return d.range;
        })
        .attr("class", "legendText")
        .attr("transform", (d,i) => {
           return "translate(3," + ((i*25) + 15) + ")";
        });
}

//Returns an array used by the legend to colour the rectangles and determine the labels.
function getDomainData() {
    const domains = [];

    domains.push({
        range: "45°+",
        domain: 20
    });

    domains.push({
        range: "40° to 44°",
        domain: 19
    });

    domains.push({
        range: "35° to 39°",
        domain: 18
    });

    domains.push({
        range: "30° to 34°",
        domain: 17
    });

    domains.push({
        range: "25° to 29°",
        domain: 16
    });

    domains.push({
        range: "20° to 24°",
        domain: 15
    });

    domains.push({
        range: "15° to 19°",
        domain: 14
    });

    domains.push({
        range: "10° to 14°",
        domain: 13
    });

    domains.push({
        range: "5° to 9°",
        domain: 12
    });

    domains.push({
        range: "0° to 4°",
        domain: 11
    });

    domains.push({
        range: "-5° to -1°",
        domain: 10
    });

    domains.push({
        range: "-10° to -6°",
        domain: 9
    });

    domains.push({
        range: "-15° to -11°",
        domain: 8
    });

    domains.push({
        range: "-20° to -16°",
        domain: 7
    });

    domains.push({
        range: "-25° to -21°",
        domain: 6
    });

    domains.push({
        range: "-30° to -26°",
        domain: 5
    });

    domains.push({
        range: "-35° to -31°",
        domain: 4
    });

    domains.push({
        range: "-40° to -36°",
        domain: 3
    });

    domains.push({
        range: "-45° to -41°",
        domain: 2
    });

    domains.push({
        range: "-50°-",
        domain: 1
    });

    return domains;
}


