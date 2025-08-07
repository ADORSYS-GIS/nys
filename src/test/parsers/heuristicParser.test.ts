import * as assert from 'assert';
import { HeuristicParser } from '../../parsers/heuristicParser';

suite('HeuristicParser Tests', () => {
  test('Should parse structured tool commands', () => {
    const parser = new HeuristicParser();
    const result = parser.parseInput('tool:testTool param1=value1 param2=123');

    assert.strictEqual(result?.name, 'testTool');
    assert.deepStrictEqual(result?.params, { param1: 'value1', param2: 123 });
  });

  test('Should handle boolean and number parameter values', () => {
    const parser = new HeuristicParser();
    const result = parser.parseInput('tool:testTool param1=true param2=42 param3=false');

    assert.strictEqual(result?.name, 'testTool');
    assert.deepStrictEqual(result?.params, { param1: true, param2: 42, param3: false });
  });

  test('Should estimate confidence correctly', () => {
    const parser = new HeuristicParser();

    // Structured format should have 100% confidence
    assert.strictEqual(parser.estimateConfidence('tool:testTool param=value'), 1.0);

    // Low confidence for unclear prompts
    assert.ok(parser.estimateConfidence('Tell me about the weather') < 0.5);
  });
});
