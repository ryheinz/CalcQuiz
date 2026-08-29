import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Calculator } from './components/Calculator';
import { Quiz } from './components/Quiz';
import { Progress } from './components/Progress';

type Tab = 'calculator' | 'quiz' | 'progress';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('calculator');

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'calculator' ? <Calculator /> : activeTab === 'quiz' ? <Quiz /> : <Progress />}
    </Layout>
  );
}
