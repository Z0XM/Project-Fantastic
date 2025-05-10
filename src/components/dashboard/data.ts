export interface Shareholder {
  id: string;
  name: string;
  type: 'Founder' | 'Investor' | 'Employee' | 'Other';
  shares: number;
  percentage: number;
  invested?: number;
  joinDate: string;
}

export interface Round {
  id: string;
  name: string;
  date: string;
  amount: number;
  valuation: number;
  investors: string[];
  shares: number;
  description: string;
}

export interface CapTable {
  companyName: string;
  totalShares: number;
  totalValuation: number;
  shareholders: Shareholder[];
  rounds: Round[];
}

export const capTable: CapTable = {
  companyName: 'Acme Tech Inc.',
  totalShares: 1000000,
  totalValuation: 25000000,
  shareholders: [
    {
      id: 'sh1',
      name: 'John Smith',
      type: 'Founder',
      shares: 300000,
      percentage: 30,
      joinDate: '2021-01-15',
    },
    {
      id: 'sh2',
      name: 'Jane Doe',
      type: 'Founder',
      shares: 300000,
      percentage: 30,
      joinDate: '2021-01-15',
    },
    {
      id: 'sh3',
      name: 'Venture Partners',
      type: 'Investor',
      shares: 200000,
      percentage: 20,
      invested: 5000000,
      joinDate: '2021-06-10',
    },
    {
      id: 'sh4',
      name: 'Angel Group',
      type: 'Investor',
      shares: 100000,
      percentage: 10,
      invested: 2000000,
      joinDate: '2021-03-22',
    },
    {
      id: 'sh5',
      name: 'Employee Pool',
      type: 'Employee',
      shares: 100000,
      percentage: 10,
      joinDate: '2021-07-01',
    },
  ],
  rounds: [
    {
      id: 'r1',
      name: 'Pre-Seed',
      date: '2021-03-22',
      amount: 2000000,
      valuation: 8000000,
      investors: ['Angel Group'],
      shares: 100000,
      description: 'Initial funding to develop MVP',
    },
    {
      id: 'r2',
      name: 'Seed',
      date: '2021-06-10',
      amount: 5000000,
      valuation: 15000000,
      investors: ['Venture Partners'],
      shares: 200000,
      description: 'Funding for market launch and initial growth',
    },
    {
      id: 'r3',
      name: 'Series A',
      date: '2022-02-15',
      amount: 8000000,
      valuation: 25000000,
      investors: ['Venture Partners', 'Angel Group'],
      shares: 160000,
      description: 'Expansion funding for scaling operations',
    },
  ],
};
