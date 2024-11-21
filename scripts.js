let companyData = {};
let employeeData = [];

// Load JSON files
async function loadJSONFiles() {
    try {
        const companyResponse = await fetch('company.json');
        companyData = await companyResponse.json();

        const employeeResponse = await fetch('employees.json');
        employeeData = await employeeResponse.json();

        console.log('Company data loaded:', companyData);
        console.log('Employee data loaded:', employeeData);
    } catch (error) {
        console.error('Error loading JSON files:', error);
    }
}

// Global variables for the current graphs
let currentCompanyChart = null;
let currentStressChart = null;
let currentMetricChart = null;

// Generate Company Graph
function generateCompanyGraph() {
    const metric = document.getElementById("metric-company").value;
    const graphType = document.getElementById("graph-type-company").value;
    const startMonth = document.getElementById("start-month").value;
    const endMonth = document.getElementById("end-month").value;

    const metricMap = {
        "Health+ App": "health_plus_app",
        "Wellness programs": "wellness_programs",
        "EAP": "eap",
        "Turnover rate": "turnover_rate",
        "Absenteeism rate": "absenteeism_rate",
        "Mental health claims": "mental_health_claims",
        "Health insurance claims related to stress": "health_insurance_claims_related_to_stress"
    };

    const selectedMetric = metricMap[metric];
    const startIndex = companyData.monthly_data.findIndex(month => month.month === startMonth);
    const endIndex = companyData.monthly_data.findIndex(month => month.month === endMonth);

    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
        alert("Invalid month range.");
        return;
    }

    const months = [];
    const values = [];
    for (let i = startIndex; i <= endIndex; i++) {
        months.push(companyData.monthly_data[i].month);
        if (selectedMetric in companyData.monthly_data[i].wellness_usage_rates) {
            values.push(companyData.monthly_data[i].wellness_usage_rates[selectedMetric]);
        } else if (selectedMetric in companyData.monthly_data[i].retention_rates) {
            values.push(companyData.monthly_data[i].retention_rates[selectedMetric]);
        } else if (selectedMetric in companyData.monthly_data[i].medical_claims) {
            values.push(companyData.monthly_data[i].medical_claims[selectedMetric]);
        }
    }

    // Destroy previous chart if it exists
    if (currentCompanyChart) {
        currentCompanyChart.destroy();
    }

    const ctx = document.getElementById("company-graph").getContext("2d");
    currentCompanyChart = new Chart(ctx, {
        type: graphType.toLowerCase(),
        data: {
            labels: months,
            datasets: [
                {
                    label: metric,
                    data: values,
                    borderColor: "blue",
                    backgroundColor: "rgba(0, 123, 255, 0.5)"
                }
            ]
        }
    });
}


// Generate Top Sources of Stress Graph with Multiple Filters
function generateStressGraph() {
    const startDay = document.getElementById("start-day-stress").value;
    const endDay = document.getElementById("end-day-stress").value;
    const genderFilter = document.getElementById("filter-gender-stress").value.toLowerCase();
    const raceFilter = document.getElementById("filter-race-stress").value.toLowerCase();
    const departmentFilter = document.getElementById("filter-department-stress").value;
    const roleFilter = document.getElementById("filter-role-stress").value;

    const stressCounts = {};

    employeeData.forEach(employee => {
        // Apply gender, race, department, and role filters
        if (genderFilter !== "all" && employee.demographics.gender.toLowerCase() !== genderFilter) return;
        if (raceFilter !== "all" && employee.demographics.race.toLowerCase() !== raceFilter) return;
        if (departmentFilter !== "all" && employee.demographics.department !== departmentFilter) return;
        if (roleFilter !== "all" && employee.demographics.role !== roleFilter) return;

        employee.daily_data.forEach(entry => {
            if (entry.date < startDay || entry.date > endDay) return;

            entry.active_data.stress_sources.forEach(source => {
                if (source === "N/A" || source === "") return;
                stressCounts[source] = (stressCounts[source] || 0) + 1;
            });
        });
    });

    const stressSources = Object.keys(stressCounts);
    const values = stressSources.map(source => stressCounts[source]);

    // Destroy previous chart if it exists
    if (currentStressChart) {
        currentStressChart.destroy();
    }

    const ctx = document.getElementById("stress-graph").getContext("2d");
    currentStressChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: stressSources,
            datasets: [
                {
                    label: "Top Sources of Stress",
                    data: values,
                    backgroundColor: "rgba(255, 99, 132, 0.5)"
                }
            ]
        }
    });
}

let compareMode = false;

function toggleCompareMode() {
    compareMode = !compareMode;
    const secondDataset = document.getElementById("second-dataset");
    secondDataset.style.display = compareMode ? "block" : "none";
}

function generateMetricGraph() {
    const startDay = document.getElementById("start-day-metric").value;
    const endDay = document.getElementById("end-day-metric").value;

    // First dataset filters
    const genderFilter1 = document.getElementById("filter-gender-metric").value.toLowerCase();
    const raceFilter1 = document.getElementById("filter-race-metric").value.toLowerCase();
    const departmentFilter1 = document.getElementById("filter-department-metric").value;
    const roleFilter1 = document.getElementById("filter-role-metric").value;
    const metric1 = document.getElementById("metric-select").value;

    const graphType = document.getElementById("graph-type-metric").value;

    // Filter first dataset
    const data1 = getFilteredData(startDay, endDay, genderFilter1, raceFilter1, departmentFilter1, roleFilter1, metric1);

    // Handle Compare Mode
    let datasets = [
        {
            label: metric1.replace(/_/g, " ").toUpperCase(),
            data: data1.values,
            borderColor: "rgba(54, 162, 235, 0.8)",
            backgroundColor: graphType === "bar" ? "rgba(54, 162, 235, 0.5)" : undefined,
            fill: graphType === "line",
        },
    ];

    if (compareMode) {
        // Second dataset filters
        const genderFilter2 = document.getElementById("filter-gender-metric-2").value.toLowerCase();
        const raceFilter2 = document.getElementById("filter-race-metric-2").value.toLowerCase();
        const departmentFilter2 = document.getElementById("filter-department-metric-2").value;
        const roleFilter2 = document.getElementById("filter-role-metric-2").value;
        const metric2 = document.getElementById("metric-select-2").value;

        // Filter second dataset
        const data2 = getFilteredData(startDay, endDay, genderFilter2, raceFilter2, departmentFilter2, roleFilter2, metric2);

        datasets.push({
            label: metric2.replace(/_/g, " ").toUpperCase(),
            data: data2.values,
            borderColor: "rgba(255, 99, 132, 0.8)",
            backgroundColor: graphType === "bar" ? "rgba(255, 99, 132, 0.5)" : undefined,
            fill: graphType === "line",
        });
    }

    // Destroy previous chart if it exists
    if (currentMetricChart) {
        currentMetricChart.destroy();
    }

    const ctx = document.getElementById("metric-graph").getContext("2d");
    currentMetricChart = new Chart(ctx, {
        type: graphType, // Use the selected graph type
        data: {
            labels: data1.dates, // Use dates from the first dataset
            datasets: datasets,
        },
    });
}

function getFilteredData(startDay, endDay, genderFilter, raceFilter, departmentFilter, roleFilter, selectedMetric) {
    const dailyMetrics = {};

    employeeData.forEach(employee => {
        // Apply demographic filters
        if (genderFilter !== "all" && employee.demographics.gender.toLowerCase() !== genderFilter) return;
        if (raceFilter !== "all" && employee.demographics.race.toLowerCase() !== raceFilter) return;
        if (departmentFilter !== "all" && employee.demographics.department !== departmentFilter) return;
        if (roleFilter !== "all" && employee.demographics.role !== roleFilter) return;

        employee.daily_data.forEach(entry => {
            if (entry.date < startDay || entry.date > endDay) return;

            const metricValue = entry.scores[selectedMetric] || entry.passive_data[selectedMetric] || entry.workplace_data[selectedMetric] || entry.active_data[selectedMetric];

            if (!(entry.date in dailyMetrics)) {
                dailyMetrics[entry.date] = { total: 0, count: 0 };
            }
            dailyMetrics[entry.date].total += metricValue;
            dailyMetrics[entry.date].count++;
        });
    });

    const dates = Object.keys(dailyMetrics).sort();
    const values = dates.map(date => dailyMetrics[date].total / dailyMetrics[date].count);

    return { dates, values };
}






// Load JSON files on page load
window.onload = loadJSONFiles;

// Function to visualize organization info and annual costs
function displayOrganizationInfo() {
    const orgDetails = document.getElementById("org-details");

    // Ensure company data is loaded
    if (!companyData || Object.keys(companyData).length === 0) {
        orgDetails.innerHTML = "<p>Loading organization data...</p>";
        return;
    }

    // Organization Info
    const { organization_info, annual_costs } = companyData;

    const orgInfoHTML = `
        <table>
            <tr><th colspan="2">Organization Info</th></tr>
            <tr><td>Company Size:</td><td>${organization_info.company_size}</td></tr>
            <tr><td>Industry:</td><td>${organization_info.industry}</td></tr>
            <tr><td>Location:</td><td>${organization_info.location}</td></tr>
        </table>
    `;

    // Annual Costs
    const annualCostsHTML = `
        <table>
            <tr><th colspan="2">Annual Costs</th></tr>
            <tr><td>Wellness Program Total Costs:</td><td>$${annual_costs.wellness_program_total_costs.toLocaleString()}</td></tr>
            <tr><td>EAP Costs:</td><td>$${annual_costs.eap_costs.toLocaleString()}</td></tr>
            <tr><td>Turnover Costs:</td><td>$${annual_costs.turnover_costs.toLocaleString()}</td></tr>
            <tr><td>Absenteeism Cost:</td><td>$${annual_costs.absenteeism_cost.toLocaleString()}</td></tr>
            <tr><td>Mental Health Claims Cost:</td><td>$${annual_costs.mental_health_claims_cost.toLocaleString()}</td></tr>
            <tr><td>Health Insurance Claims Related to Stress Cost:</td><td>$${annual_costs.health_insurance_claims_related_to_stress_cost.toLocaleString()}</td></tr>
        </table>
    `;

    // Set the HTML content
    orgDetails.innerHTML = orgInfoHTML + annualCostsHTML;
}

// Load JSON files and display organization info on page load
window.onload = async () => {
    await loadJSONFiles();
    displayOrganizationInfo();
};



// Calculate Monthly Wellness Score from Employee Data
function calculateMonthlyWellnessScores(month) {
    const monthData = employeeData.flatMap(employee => 
        employee.daily_data.filter(entry => entry.date.startsWith(month))
    );

    if (monthData.length === 0) return 0;

    const totalScore = monthData.reduce((sum, entry) => sum + entry.scores.overall_score, 0);
    return (totalScore / monthData.length).toFixed(2);
}

// Calculate Yearly Average Wellness Score
function calculateYearlyWellnessAverage() {
    const months = ["2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06"];
    const totalScore = months.reduce((sum, month) => sum + parseFloat(calculateMonthlyWellnessScores(month)), 0);
    return (totalScore / months.length).toFixed(2);
}

// Calculate Percentage Change in Wellness Scores
function calculateWellnessChange(selectedMonth) {
    const monthIndex = ["January 2024", "February 2024", "March 2024", "April 2024", "May 2024", "June 2024"].indexOf(selectedMonth);
    if (monthIndex === 0) return null;

    const currentMonth = calculateMonthlyWellnessScores(`2024-0${monthIndex + 1}`);
    const previousMonth = calculateMonthlyWellnessScores(`2024-0${monthIndex}`);

    return (((currentMonth - previousMonth) / previousMonth) * 100).toFixed(2);
}

function calculateTopDepartmentsAtRisk(month) {
    const departmentScores = {};

    // Filter data for the given month
    employeeData.forEach(employee => {
        const monthlyData = employee.daily_data.filter(entry => entry.date.startsWith(month));
        if (monthlyData.length > 0) {
            const totalScore = monthlyData.reduce((sum, entry) => sum + entry.scores.overall_score, 0);
            const avgScore = totalScore / monthlyData.length;

            // Aggregate by department
            if (!(employee.demographics.department in departmentScores)) {
                departmentScores[employee.demographics.department] = { total: 0, count: 0 };
            }
            departmentScores[employee.demographics.department].total += avgScore;
            departmentScores[employee.demographics.department].count++;
        }
    });

    // Calculate average score for each department
    const departmentAverages = Object.keys(departmentScores).map(department => ({
        department,
        avgScore: departmentScores[department].total / departmentScores[department].count
    }));

    // Sort by average score (ascending) and return the top 3
    departmentAverages.sort((a, b) => a.avgScore - b.avgScore);
    return departmentAverages.slice(0, 3).map(item => `${item.department} (${item.avgScore.toFixed(2)})`);
}


function updateWellnessSummary() {
    const selectedMonth = document.getElementById("month-select").value;
    const monthCode = `2024-0${["January", "February", "March", "April", "May", "June"].indexOf(selectedMonth.split(" ")[0]) + 1}`;
    const monthlyScore = calculateMonthlyWellnessScores(monthCode);
    const yearlyAvg = calculateYearlyWellnessAverage();
    const wellnessChange = calculateWellnessChange(selectedMonth);
    const topDepartments = calculateTopDepartmentsAtRisk(monthCode);

    const { turnover_costs, absenteeism_cost, mental_health_claims_cost, health_insurance_claims_related_to_stress_cost } = companyData.annual_costs;
    const totalCost = turnover_costs + absenteeism_cost + mental_health_claims_cost + health_insurance_claims_related_to_stress_cost;
    const potentialSavings = totalCost * 0.1; // Assuming 10% savings

    // Determine color class based on increase/decrease
    const changeClass = wellnessChange > 0 ? "increase" : "decrease";

    const monthlyPercentage = (monthlyScore / 4) * 100;
    const yearlyPercentage = (yearlyAvg / 4) * 100;

    const cardHTML = `
        <div style="display: flex; flex-direction: row; width: 100%; justify-content: center; gap: 10px; align-items: center;">
            <h3>Wellness Scores for ${selectedMonth}</h3> 
            <div class="info-icon">
                <i class="fas fa-question-circle"></i>
                <div class="info-bubble">
                    The Wellness Score is an AI-powered metric that reflects your organization’s current employee health based on <a href="/our-data.html">multiple data streams</a>, the Industry Average benchmarks your performance against similar organizations, and Departments for Impact identifies low-scoring departments within your organization in need of resources.
                </div>
            </div>
        </div>

        <div style="display: flex; flex-direction: row; width: 100%; justify-content: center; align-items: center;">
            <div style="padding: 30px">
                <h4>This Month Average</h4>
                <div class="circle-chart" style="--percentage: ${monthlyPercentage}">
                    <span>${monthlyScore}</span>
                </div>
            </div>
            <div style="padding: 30px">
                <h4>Yearly Average</h4>
                <div class="circle-chart" style="--percentage: ${yearlyPercentage}">
                    <span>${yearlyAvg}</span>
                </div>
            </div>
            <div style="padding: 30px">
                <h4>Industry Average</h4>
                <div class="circle-chart" style="--percentage: 52.5">
                    <span>2.1</span>
                </div>
            </div>
        </div>
        <p style="text-align: center;">${wellnessChange !== null ? `<span class="${changeClass}">${wellnessChange > 0 ? "Wellness score increased" : "Wellness score decreased"} by ${Math.abs(wellnessChange)}% since last month</span>` : ''}</p>
        <p><strong>Departments with Most Opportunity for Impact:</strong> ${topDepartments.join(", ")}</p>
    `;

    document.getElementById("summary-card").innerHTML = cardHTML;
}


// Ensure JSON data is loaded before calculations
window.onload = async () => {
    await loadJSONFiles();
    displayOrganizationInfo();
    updateWellnessSummary();

    // Select only elements with the 'toggle-content' class
    const toggleSections = document.querySelectorAll('.toggle-content');
    toggleSections.forEach(section => {
        if (!section.classList.contains('toggle-content')) return; // Ensure only toggleable sections are affected
        if (!section.dataset.visible) {
            section.dataset.visible = "false"; // Custom data attribute to track visibility
        }
        section.style.display = 'none'; // Explicitly hide only toggle-content sections
    });

    
    
};

// Function to toggle visibility of sections
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);

    // Use the custom `data-visible` attribute to track state
    if (section.dataset.visible === "false") {
        section.style.display = 'block';
        section.dataset.visible = "true";
    } else {
        section.style.display = 'none';
        section.dataset.visible = "false";
    }
}

