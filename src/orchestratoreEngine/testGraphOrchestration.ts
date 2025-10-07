import * as vscode from 'vscode';
import { SPARCWorkflowEngine } from './sparcWorkflowEngine';
import { SimpleGraphSPARCWorkflow, WorkflowInput } from './simpleGraphWorkflow';

/**
 * Test file for Graph Orchestration with LangGraph
 * 
 * This file contains test functions to verify that the graph orchestration
 * workflow is working correctly with the SPARC workflow engine.
 */

export class GraphOrchestrationTester {
  private sparcEngine: SPARCWorkflowEngine;
  private simpleGraphWorkflow: SimpleGraphSPARCWorkflow;
  
  constructor(workspaceRoot: vscode.Uri) {
    this.sparcEngine = new SPARCWorkflowEngine(workspaceRoot);
    this.simpleGraphWorkflow = this.sparcEngine.getSimpleGraphWorkflow()!;
  }
  
  /**
   * Test basic graph orchestration workflow
   */
  async testBasicWorkflow(): Promise<boolean> {
    console.log('[Test] Starting basic workflow test...');
    
    try {
      const issueId = `test-issue-${Date.now()}`;
      const userInput = 'Create a simple user management system with CRUD operations';
      
      // Test design mode
      console.log('[Test] Testing design mode...');
      const designResult = await this.sparcEngine.processIssue(issueId, 'design', userInput);
      
      console.log('[Test] Design mode result:', {
        issueId: designResult.issueId,
        mode: designResult.mode,
        phase: designResult.currentPhase,
        progress: designResult.progress,
        artifacts: Object.keys(designResult.artifacts).filter(key => designResult.artifacts[key])
      });
      
      // Verify artifacts were generated
      const hasRequirements = !!designResult.artifacts.requirements;
      const hasArchitecture = !!designResult.artifacts.architecture;
      
      if (!hasRequirements || !hasArchitecture) {
        console.error('[Test] Design mode failed - missing artifacts');
        return false;
      }
      
      console.log('[Test] Design mode test passed ✅');
      return true;
    } catch (error) {
      console.error('[Test] Basic workflow test failed:', error);
      return false;
    }
  }
  
  /**
   * Test workflow state persistence
   */
  async testStatePersistence(): Promise<boolean> {
    console.log('[Test] Starting state persistence test...');
    
    try {
      const issueId = `persistence-test-${Date.now()}`;
      const userInput = 'Build a REST API for a blog system';
      
      // Process issue
      const result = await this.sparcEngine.processIssue(issueId, 'design', userInput);
      
      // Check if state was saved
      const status = await this.sparcEngine.getWorkflowStatus(issueId);
      
      if (!status) {
        console.error('[Test] State persistence failed - status not found');
        return false;
      }
      
      console.log('[Test] State persistence result:', {
        issueId: status.issueId,
        mode: status.mode,
        phase: status.phase,
        progress: status.progress,
        status: status.status
      });
      
      console.log('[Test] State persistence test passed ✅');
      return true;
    } catch (error) {
      console.error('[Test] State persistence test failed:', error);
      return false;
    }
  }
  
  /**
   * Test AI orchestrator decision making
   */
  async testAIOrchestrator(): Promise<boolean> {
    console.log('[Test] Starting AI orchestrator test...');
    
    try {
      const orchestrator = this.simpleGraphWorkflow.getOrchestrator();
      
      // Test decision history
      const decisionHistory = orchestrator.getDecisionHistory();
      console.log('[Test] Decision history length:', decisionHistory.length);
      
      // Test performance metrics
      const metrics = orchestrator.getPerformanceMetrics();
      console.log('[Test] Performance metrics:', Object.fromEntries(metrics));
      
      // Test orchestrator reset
      orchestrator.reset();
      const resetDecisionHistory = orchestrator.getDecisionHistory();
      
      if (resetDecisionHistory.length !== 0) {
        console.error('[Test] AI orchestrator reset failed');
        return false;
      }
      
      console.log('[Test] AI orchestrator test passed ✅');
      return true;
    } catch (error) {
      console.error('[Test] AI orchestrator test failed:', error);
      return false;
    }
  }
  
  /**
   * Test workflow metrics
   */
  async testWorkflowMetrics(): Promise<boolean> {
    console.log('[Test] Starting workflow metrics test...');
    
    try {
      const metrics = this.sparcEngine.getWorkflowMetrics();
      
      if (!metrics) {
        console.error('[Test] Workflow metrics not available');
        return false;
      }
      
      console.log('[Test] Workflow metrics:', {
        totalNodes: metrics.totalNodes,
        availableNodes: metrics.availableNodes,
        orchestratorMetrics: Object.fromEntries(metrics.orchestratorMetrics),
        decisionHistoryLength: metrics.decisionHistory.length
      });
      
      // Verify expected nodes are available
      const expectedNodes = ['specification', 'pseudocode', 'architecture', 'refinement', 'completion'];
      const hasExpectedNodes = expectedNodes.every(node => metrics.availableNodes.includes(node));
      
      if (!hasExpectedNodes) {
        console.error('[Test] Expected nodes not found in available nodes');
        return false;
      }
      
      console.log('[Test] Workflow metrics test passed ✅');
      return true;
    } catch (error) {
      console.error('[Test] Workflow metrics test failed:', error);
      return false;
    }
  }
  
  /**
   * Test graph orchestration toggle
   */
  async testGraphOrchestrationToggle(): Promise<boolean> {
    console.log('[Test] Starting graph orchestration toggle test...');
    
    try {
      // Test initial state
      const initialEnabled = this.sparcEngine.isGraphOrchestrationEnabled();
      console.log('[Test] Initial graph orchestration enabled:', initialEnabled);
      
      // Disable graph orchestration
      this.sparcEngine.setGraphOrchestrationEnabled(false);
      const disabledState = this.sparcEngine.isGraphOrchestrationEnabled();
      
      if (disabledState) {
        console.error('[Test] Failed to disable graph orchestration');
        return false;
      }
      
      // Re-enable graph orchestration
      this.sparcEngine.setGraphOrchestrationEnabled(true);
      const enabledState = this.sparcEngine.isGraphOrchestrationEnabled();
      
      if (!enabledState) {
        console.error('[Test] Failed to re-enable graph orchestration');
        return false;
      }
      
      console.log('[Test] Graph orchestration toggle test passed ✅');
      return true;
    } catch (error) {
      console.error('[Test] Graph orchestration toggle test failed:', error);
      return false;
    }
  }
  
  /**
   * Test workflow reset
   */
  async testWorkflowReset(): Promise<boolean> {
    console.log('[Test] Starting workflow reset test...');
    
    try {
      const issueId = `reset-test-${Date.now()}`;
      const userInput = 'Create a simple todo application';
      
      // Process issue to create state
      await this.sparcEngine.processIssue(issueId, 'design', userInput);
      
      // Verify state exists
      const statusBefore = await this.sparcEngine.getWorkflowStatus(issueId);
      if (!statusBefore) {
        console.error('[Test] Failed to create initial workflow state');
        return false;
      }
      
      // Reset workflow
      await this.sparcEngine.resetWorkflow(issueId);
      
      // Verify state was removed
      const statusAfter = await this.sparcEngine.getWorkflowStatus(issueId);
      if (statusAfter) {
        console.error('[Test] Workflow state still exists after reset');
        return false;
      }
      
      console.log('[Test] Workflow reset test passed ✅');
      return true;
    } catch (error) {
      console.error('[Test] Workflow reset test failed:', error);
      return false;
    }
  }
  
  /**
   * Run all tests
   */
  async runAllTests(): Promise<{ passed: number; failed: number; results: any[] }> {
    console.log('[Test] Starting comprehensive graph orchestration tests...');
    
    const tests = [
      { name: 'Basic Workflow', test: () => this.testBasicWorkflow() },
      { name: 'State Persistence', test: () => this.testStatePersistence() },
      { name: 'AI Orchestrator', test: () => this.testAIOrchestrator() },
      { name: 'Workflow Metrics', test: () => this.testWorkflowMetrics() },
      { name: 'Graph Orchestration Toggle', test: () => this.testGraphOrchestrationToggle() },
      { name: 'Workflow Reset', test: () => this.testWorkflowReset() }
    ];
    
    const results: any[] = [];
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
      try {
        console.log(`[Test] Running ${test.name}...`);
        const result = await test.test();
        
        results.push({
          name: test.name,
          passed: result,
          timestamp: new Date()
        });
        
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`[Test] ${test.name} threw an error:`, error);
        results.push({
          name: test.name,
          passed: false,
          error: error.message,
          timestamp: new Date()
        });
        failed++;
      }
    }
    
    console.log(`[Test] Test results: ${passed} passed, ${failed} failed`);
    return { passed, failed, results };
  }
}

/**
 * Utility function to run tests from VS Code extension
 */
export async function runGraphOrchestrationTests(workspaceRoot: vscode.Uri): Promise<void> {
  const tester = new GraphOrchestrationTester(workspaceRoot);
  const results = await tester.runAllTests();
  
  console.log('[Test] Graph Orchestration Test Results:');
  console.log(`[Test] Passed: ${results.passed}`);
  console.log(`[Test] Failed: ${results.failed}`);
  console.log('[Test] Detailed Results:', results.results);
  
  // Show results in VS Code
  if (results.failed === 0) {
    vscode.window.showInformationMessage(
      `✅ All ${results.passed} graph orchestration tests passed!`
    );
  } else {
    vscode.window.showErrorMessage(
      `❌ ${results.failed} out of ${results.passed + results.failed} tests failed. Check console for details.`
    );
  }
}

