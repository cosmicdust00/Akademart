import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const sqlDuration = new Trend('sql_duration',true);
const neo4jDuration = new Trend('neo4j_duration',true);

export const options = {
  stages: [
    { duration: '5s', target: 50 },
    { duration: '30s', target: 50 },
    { duration: '5s', target: 0 },
  ],
};

export default function () {
  let resSQL = http.get('http://localhost:4000/api/sql');
  check(resSQL, { 'SQL status 200 OK': (r) => r.status === 200 });
  sqlDuration.add(resSQL.timings.duration);

  let resNeo = http.get('http://localhost:4000/api/neo4j');
  check(resNeo, { 'Neo4j status 200 OK': (r) => r.status === 200 });
  neo4jDuration.add(resNeo.timings.duration);

  sleep(1);
}