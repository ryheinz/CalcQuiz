import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Calculator } from './components/Calculator';
import { Quiz } from './components/Quiz';

export default function App() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'quiz'>('calculator');

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'calculator' ? <Calculator /> : <Quiz />}
    </Layout>
  );
}
