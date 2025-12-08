import { useState } from 'react';
import { BabyService } from '../services/api';

interface TestResults {
    summary?: any;
    trend?: any;
    records?: any;
}

export const ApiTest = () => {
    const [results, setResults] = useState<TestResults>({});
    const [loading, setLoading] = useState(false);

    const testSummary = async () => {
        setLoading(true);
        try {
            await BabyService.ensureDevEnvironment();
            const babyId = BabyService.getCurrentBabyId();
            const data = await BabyService.getSummary(babyId!);
            setResults((prev: TestResults) => ({ ...prev, summary: data }));
        } catch (error: any) {
            setResults((prev: TestResults) => ({ ...prev, summary: { error: error.message } }));
        } finally {
            setLoading(false);
        }
    };

    const testTrend = async () => {
        setLoading(true);
        try {
            await BabyService.ensureDevEnvironment();
            const babyId = BabyService.getCurrentBabyId();
            const data = await BabyService.getTrends(babyId!, 7);
            setResults((prev: TestResults) => ({ ...prev, trend: data }));
        } catch (error: any) {
            setResults((prev: TestResults) => ({ ...prev, trend: { error: error.message } }));
        } finally {
            setLoading(false);
        }
    };

    const testRecords = async () => {
        setLoading(true);
        try {
            await BabyService.ensureDevEnvironment();
            const babyId = BabyService.getCurrentBabyId();
            const data = await BabyService.getRecords(babyId!, 10);
            setResults((prev: TestResults) => ({ ...prev, records: data }));
        } catch (error: any) {
            setResults((prev: TestResults) => ({ ...prev, records: { error: error.message } }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold">API 接口测试</h1>

            <div className="space-y-4">
                <div>
                    <button
                        onClick={testSummary}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                        测试 Summary 接口
                    </button>
                    {results.summary && (
                        <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto">
                            {JSON.stringify(results.summary, null, 2)}
                        </pre>
                    )}
                </div>

                <div>
                    <button
                        onClick={testTrend}
                        disabled={loading}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    >
                        测试 Trend 接口
                    </button>
                    {results.trend && (
                        <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto">
                            {JSON.stringify(results.trend, null, 2)}
                        </pre>
                    )}
                </div>

                <div>
                    <button
                        onClick={testRecords}
                        disabled={loading}
                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                    >
                        测试 Records 接口
                    </button>
                    {results.records && (
                        <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto">
                            {JSON.stringify(results.records, null, 2)}
                        </pre>
                    )}
                </div>
            </div>

            {loading && <div className="text-center">加载中...</div>}
        </div>
    );
};
