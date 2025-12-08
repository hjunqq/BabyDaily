import { Link } from 'react-router-dom';

export const Landing = () => {
    return (
        <div className="min-h-screen bg-sakura-bg flex flex-col items-center justify-center p-8 gap-8">
            <div className="text-center">
                <h1 className="text-4xl font-display font-bold text-sakura-text mb-2">BabyDaily Prototypes</h1>
                <p className="text-sakura-text/60">Select a view to explore the A/B designs</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
                <Link to="/mobile" className="group">
                    <div className="bg-white p-6 rounded-2xl shadow-xl shadow-sakura-pink/10 border border-sakura-pink/20 hover:-translate-y-1 transition-all w-64 text-center">
                        <div className="text-4xl mb-4">📱</div>
                        <h3 className="text-xl font-bold text-sakura-text mb-2">Mobile App</h3>
                        <p className="text-sm text-sakura-text/60">Sakura Baby Tracker<br />(Vertical Layout)</p>
                    </div>
                </Link>

                <Link to="/web" className="group">
                    <div className="bg-white p-6 rounded-2xl shadow-xl shadow-sakura-pink/10 border border-sakura-pink/20 hover:-translate-y-1 transition-all w-64 text-center">
                        <div className="text-4xl mb-4">💻</div>
                        <h3 className="text-xl font-bold text-sakura-text mb-2">Web Dashboard</h3>
                        <p className="text-sm text-sakura-text/60">Little Blossom Tracker<br />(Desktop Layout)</p>
                    </div>
                </Link>
            </div>
        </div>
    );
};
