/**
 * Frontend Test for Approval Dialog Warning
 * Tests that the warning appears when approving applications
 */

const puppeteer = require('puppeteer');

async function testApprovalDialogWarning() {
    console.log('🚀 Starting Frontend Approval Dialog Warning Test');
    console.log('=' * 50);
    
    let browser;
    let results = [];
    
    function logTest(testName, success, message = '') {
        const status = success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status}: ${testName}`);
        if (message) {
            console.log(`    ${message}`);
        }
        results.push({ test: testName, success, message });
        console.log();
    }
    
    try {
        // Launch browser
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        
        // Navigate to the frontend
        const frontendUrl = process.env.REACT_APP_BACKEND_URL || 'https://holiday-anims.preview.emergentagent.com';
        await page.goto(`${frontendUrl}/moderator/login`);
        
        // Login as admin
        await page.waitForSelector('input[placeholder*="username"]', { timeout: 10000 });
        await page.type('input[placeholder*="username"]', 'admin');
        await page.type('input[placeholder*="password"]', 'Admin123!@');
        await page.click('button[type="submit"]');
        
        // Wait for redirect to dashboard
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        
        // Check if we're on the dashboard
        const currentUrl = page.url();
        if (currentUrl.includes('/moderator/dashboard') || currentUrl.includes('/moderator/portal')) {
            logTest('Admin Login', true, 'Successfully logged in as admin');
        } else {
            logTest('Admin Login', false, `Unexpected URL after login: ${currentUrl}`);
            return;
        }
        
        // Navigate to applications dashboard if not already there
        if (!currentUrl.includes('/moderator/dashboard')) {
            await page.goto(`${frontendUrl}/moderator/dashboard`);
            await page.waitForSelector('[data-testid="applications-table"]', { timeout: 10000 });
        }
        
        // Look for applications table
        const applicationsTable = await page.$('[data-testid="applications-table"]');
        if (!applicationsTable) {
            logTest('Applications Table', false, 'Applications table not found');
            return;
        }
        
        logTest('Applications Table', true, 'Applications table found');
        
        // Find the first application with a view button
        const viewButton = await page.$('[data-testid^="view-btn-"]');
        if (!viewButton) {
            logTest('Application View Button', false, 'No view button found');
            return;
        }
        
        logTest('Application View Button', true, 'Found application view button');
        
        // Click the view button to open application details
        await viewButton.click();
        
        // Wait for the application detail dialog
        await page.waitForSelector('[data-testid="application-detail-dialog"]', { timeout: 5000 });
        logTest('Application Detail Dialog', true, 'Application detail dialog opened');
        
        // Look for the approve button
        const approveButton = await page.$('[data-testid="approve-btn"]');
        if (!approveButton) {
            logTest('Approve Button', false, 'Approve button not found (application may not be in pending status)');
            
            // Try to find change status button instead
            const changeStatusButton = await page.$('[data-testid="change-status-btn"]');
            if (changeStatusButton) {
                logTest('Change Status Button', true, 'Found change status button');
                await changeStatusButton.click();
                
                // Wait for status change dialog
                await page.waitForSelector('select', { timeout: 5000 });
                
                // Select approved status
                await page.select('select', 'approved');
                
                // Check for warning message
                await page.waitForTimeout(1000); // Wait for warning to appear
                
                const warningText = await page.evaluate(() => {
                    const warningElements = Array.from(document.querySelectorAll('*')).filter(el => 
                        el.textContent && el.textContent.includes('Note: Your comment below will be included in the approval email')
                    );
                    return warningElements.length > 0 ? warningElements[0].textContent : null;
                });
                
                if (warningText) {
                    logTest('Approval Warning Message', true, 'Warning message appears when selecting approved status');
                } else {
                    logTest('Approval Warning Message', false, 'Warning message not found when selecting approved status');
                }
            } else {
                logTest('Status Change Options', false, 'No approve or change status button found');
            }
            return;
        }
        
        logTest('Approve Button', true, 'Found approve button');
        
        // Click the approve button
        await approveButton.click();
        
        // Wait for the status change dialog
        await page.waitForSelector('.text-amber-400', { timeout: 5000 });
        
        // Check for the warning message
        const warningText = await page.evaluate(() => {
            const warningElements = Array.from(document.querySelectorAll('*')).filter(el => 
                el.textContent && el.textContent.includes('Note: Your comment below will be included in the approval email')
            );
            return warningElements.length > 0 ? warningElements[0].textContent : null;
        });
        
        if (warningText) {
            logTest('Approval Warning Message', true, 'Warning message appears in approval dialog');
            
            // Check if warning has amber styling
            const hasAmberStyling = await page.evaluate(() => {
                const warningContainer = Array.from(document.querySelectorAll('*')).find(el => 
                    el.textContent && el.textContent.includes('Note: Your comment below will be included in the approval email')
                );
                if (warningContainer) {
                    const parentDiv = warningContainer.closest('div');
                    return parentDiv && (
                        parentDiv.className.includes('amber') || 
                        parentDiv.className.includes('bg-amber') ||
                        parentDiv.className.includes('border-amber')
                    );
                }
                return false;
            });
            
            if (hasAmberStyling) {
                logTest('Warning Styling', true, 'Warning has proper amber styling');
            } else {
                logTest('Warning Styling', false, 'Warning does not have amber styling');
            }
        } else {
            logTest('Approval Warning Message', false, 'Warning message not found in approval dialog');
        }
        
        // Test that warning doesn't appear for rejection
        const cancelButton = await page.$('button:contains("Cancel")') || await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(btn => btn.textContent.includes('Cancel'));
        });
        
        if (cancelButton) {
            await page.evaluate(btn => btn.click(), cancelButton);
            await page.waitForTimeout(500);
        }
        
        // Try to test rejection (if reject button exists)
        const rejectButton = await page.$('[data-testid="reject-btn"]');
        if (rejectButton) {
            await rejectButton.click();
            await page.waitForTimeout(1000);
            
            const rejectionWarningText = await page.evaluate(() => {
                const warningElements = Array.from(document.querySelectorAll('*')).filter(el => 
                    el.textContent && el.textContent.includes('Note: Your comment below will be included in the approval email')
                );
                return warningElements.length > 0;
            });
            
            if (!rejectionWarningText) {
                logTest('Rejection No Warning', true, 'Warning correctly does not appear for rejection');
            } else {
                logTest('Rejection No Warning', false, 'Warning incorrectly appears for rejection');
            }
        }
        
    } catch (error) {
        logTest('Frontend Test', false, `Exception: ${error.message}`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
    
    // Summary
    console.log('=' * 50);
    console.log('📊 Frontend Test Summary');
    console.log('=' * 50);
    
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;
    
    console.log(`Total Tests: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
        console.log('\n🔍 Failed Tests:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  - ${r.test}: ${r.message}`);
        });
    }
    
    return failed === 0;
}

// Run the test
testApprovalDialogWarning().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Test failed with error:', error);
    process.exit(1);
});