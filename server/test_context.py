import unittest
import nfl_chat as chat


class ContextTest(unittest.TestCase):
    def test_context_includes_actual_league_and_tactics_explanations(self):
        text, sources = chat.curate({'date': '2026-10-25', 'leagueWide': [{'title':'league', 'why':'league body evidence', 'url':'https://www.nfl.com/news/verified'}], 'tactics':[{'concept':'two routes', 'gameUse':'third and nine', 'defenseCounter':'zone exchange', 'breakdown':[{'text':'read middle defender'}], 'source':{'label':'analysis','url':'https://www.patriots.com/news/analysis'}}]})
        for expected in ['league body evidence','two routes','third and nine','zone exchange','read middle defender']:
            self.assertIn(expected,text)
        self.assertEqual({s['url'] for s in sources},{'https://www.nfl.com/news/verified','https://www.patriots.com/news/analysis'})
