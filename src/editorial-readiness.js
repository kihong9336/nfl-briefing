// Structural tripwire only: this does not certify factual or editorial quality.
export function editorialReadiness(edition) {
  const completedToday=(edition.schedule??[]).some(g=>g.gameDate===edition.date&&g.status==='종료');
  const missing=[];
  if(completedToday&&!edition.tactics?.length) missing.push('전술노트');
  if(completedToday&&!edition.highlights?.length) missing.push('하이라이트');
  return {status:missing.length?'needs-review':'structural-checks-passed',missing,completedToday};
}
export function teamPlacementNotice(topStories, filter='all') {
  const relevant=topStories.filter(s=>['49ers','Chiefs','Patriots'].includes(s.team)&&(filter==='all'||s.team===filter));
  if(relevant.length) return `${[...new Set(relevant.map(s=>s.team))].join(' · ')} 소식은 상단 ‘오늘의 짧은 브리핑’에 수록했습니다. 중복 기사는 아래에 반복하지 않습니다.`;
  return '이 날짜에 수록된 별도 기사가 없습니다. 해당 팀에 소식 자체가 없다는 뜻은 아닙니다.';
}
