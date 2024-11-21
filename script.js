// Function to load jsPDF dynamically
async function loadJSPDF() {
    if (typeof jsPDF === 'undefined') {
        await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }
}
// Utility function to calculate weekly averages, ignoring null values
function calculateWeeklyAverages(dailyData) {
    const weeks = [[], [], [], []];
    dailyData.forEach((entry, index) => {
        if (Object.values(entry).some(value => value === null)) {
            console.warn(`Skipping day due to null values:`, entry);
            return;
        }

        const weekIndex = Math.floor(index / 7); // Group by week
        if (weekIndex < 4) weeks[weekIndex].push(entry);
    });

    return weeks.map((week, weekIndex) => {
        if (week.length === 0) {
            console.warn(`Week ${weekIndex + 1} has no valid data.`);
            return {};
        }

        const averagedWeek = week.reduce((acc, day) => {
            Object.keys(day).forEach(key => {
                acc[key] = (acc[key] || 0) + day[key] / week.length;
            });
            return acc;
        }, {});
        return averagedWeek;
    });
}

// Utility function to group by department and calculate weekly averages
function groupByDepartment(employeeData) {
    const departmentData = {};

    employeeData.forEach(employee => {
        const validDailyData = employee.daily_data.map(day => ({
            step_count: day.passive_data.step_count,
            physical_activity: day.passive_data.physical_activity,
            heart_rate: day.passive_data.heart_rate,
            hours_sleep: day.passive_data.hours_sleep,
            calendar_meetings: day.workplace_data.calendar_meetings,
            meeting_duration: day.workplace_data.meeting_duration,
            stress_level: day.active_data.stress_level,
            overall_score: day.scores.overall_score,
        })).filter(day => {
            const hasNull = Object.values(day).some(value => value === null);
            if (hasNull) console.warn(`Filtered out day due to null values:`, day);
            return !hasNull;
        });

        const weeklyAverages = calculateWeeklyAverages(validDailyData);

        const department = employee.demographics.department;
        if (!departmentData[department]) departmentData[department] = [];
        departmentData[department].push(weeklyAverages);
    });

    const aggregatedDepartments = {};
    Object.keys(departmentData).forEach(department => {
        aggregatedDepartments[department] = departmentData[department][0].map((_, weekIndex) => {
            const weekData = departmentData[department].map(empData => empData[weekIndex]);
            const averagedWeek = weekData.reduce((acc, week) => {
                Object.keys(week).forEach(key => {
                    acc[key] = (acc[key] || 0) + week[key] / weekData.length;
                });
                return acc;
            }, {});
            return averagedWeek;
        });
    });

    return aggregatedDepartments;
}

// Main report generation
document.getElementById('generate-report').addEventListener('click', async () => {
    const selectedMonth = document.getElementById('month-select').value;

    // Update status message
    const reportOutput = document.getElementById('report-output');
    reportOutput.textContent = "Your report is being generated, please be patient, this may take up to 30 seconds.";

    try {
        // Load data
        const companyData = await fetch('company.json').then(res => res.json());
        const employeesData = await fetch('employees.json').then(res => res.json());

        // Filter employee data for the selected month
        const monthIndex = ["January", "February", "March", "April", "May", "June"].indexOf(selectedMonth) + 1;
        const filteredEmployees = employeesData.map(employee => ({
            ...employee,
            daily_data: employee.daily_data.filter(day => {
                const dayMonth = new Date(day.date).getMonth() + 1;
                return dayMonth === monthIndex;
            })
        }));

        // Group by department and calculate weekly averages
        const departmentData = groupByDepartment(filteredEmployees);

        // Prepare aggregated data for API
        const requestData = {
            month: selectedMonth,
            company_data: companyData,
            department_data: departmentData // Include aggregated department data
        };

        // Log the request data to the console for debugging
        console.log("Final request data being sent to OpenAI API:", JSON.stringify(requestData, null, 2));

        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-proj-XXXXXXXXXX'
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `
                        As an HR representative, analyze the provided organizational wellness data to generate a comprehensive report that includes the following elements:

1. Executive Summary
- Purpose of the Report: Highlight why employee wellness is a priority (e.g., its link to productivity, engagement, and regretted attrition).
- Key Findings: Summarize major insights.
- Recommendations: Preview high-level actions.

2. Key Findings:
   - Overall trends in organizational wellness over the weeks.
   - Identification of departments and demographics most at risk.
   - Potential root causes of stress or burnout in the organization.
   - Mention 3-4 specific numerical values and quantitative observations.

3. Employee Listening and Sentiment Analysis
   - Summarize key sources of stress
   - Identify recurring topics, especially among demographics
   - Mention 2-3 specific numerical values and quantitative observations.

4. Analysis of Attrition
   - Identify turnover, absenteeism, and factors driving attrition
   - Insights by team, role, department, etc
   - Correlation with wellness data, compare wellness scores and risk patterns for attrition
   - Mention 2 specific numerical values and quantitative observations.

5. Human Capital and Talent Strategy
   - Demonstrate how wellness impacts key talent outcomes
   - Showcase strategies targeting high-value talent

6. Manager Tools
   - Draft an outline of a specific, actionable toolkit for manager training that proposes enhancements to communication tools and wellness integration and what the results would be.

7. Actionable Steps:  
   - List specific actions to improve mental and physical well-being across the organization. Be creative and unique!
   - Prioritize these actions based on urgency and potential impact.

8. Recommendations and Insights:  
   - Suggest additional initiatives or strategies to address emerging concerns.
   - Be specific and creative, the more unique and original, the better!

9. Suggested Visuals:
   - Suggest which metrics would be recommended to visualize alongside the report to enhance the clarity of the analysis.
   - You can choose filters such as highlighting certain departments, gender, race, role, etc.
   - Encourage them to try the visualizations using our visual mode.
10. Conclusion
   - Summarize

Ensure the report is structured with clear sections and professional language. DO NOT format the report! Do not include formatting characters like '#' and '**'.
`
                    },
                    {
                        role: "user",
                        content: `
Month: ${requestData.month}

Company Metadata:
${JSON.stringify(requestData.company_data, null, 2)}

Department Data:
${Object.entries(requestData.department_data)
    .map(
        ([department, weeklyData]) =>
            `Department: ${department}, Weekly Data: ${JSON.stringify(weeklyData, null, 2)}`
    )
    .join("\n")}
                        `
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            console.error("OpenAI API Error:", errorDetails);
            throw new Error(`OpenAI API Error: ${errorDetails.error.message}`);
        }

        const result = await response.json();

        // Display the report
        const report = result.choices[0]?.message?.content || "Error generating report.";
        document.getElementById('report-output').textContent = report;

        // Show download button
        const downloadButton = document.getElementById('download-pdf');
        const visualButton = document.getElementById('visual');
        await loadJSPDF(); // Ensure jsPDF is loaded
        const { jsPDF } = window.jspdf;
    
        downloadButton.style.display = "block";
        visualButton.style.display = "block";


        // Attach click event to download PDF
        downloadButton.addEventListener('click', () => {
            const doc = new jsPDF();
            const pageHeight = doc.internal.pageSize.height; // Height of a page in the PDF
            const margin = 10; // Margin size
            const lineHeight = 10; // Height of each line
            const content = document.getElementById('report-output').textContent; // Get the report text
            const lines = doc.splitTextToSize(content, 180); // Wrap text to fit the page width

            let y = margin; // Y-coordinate for the text
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("Organizational Wellness Report", margin, y);
            y += 2 * lineHeight;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);

            // Loop through the lines and add them to the PDF
            lines.forEach((line, index) => {
                if (y + lineHeight > pageHeight - margin) {
                    // If the current line exceeds the page height, add a new page
                    doc.addPage();
                    y = margin; // Reset y-coordinate for the new page
                }
                doc.text(line, margin, y);
                y += lineHeight; // Increment y-coordinate for the next line
            });

            // Save the PDF
            doc.save(`Organizational_Wellness_Report.pdf`);
        });
    } catch (error) {
        console.error("Error during report generation:", error);
        document.getElementById('report-output').textContent = `Error: ${error.message}`;
    }
});
