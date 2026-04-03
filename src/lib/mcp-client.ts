import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_REMOTE_URL = process.env.MCP_REMOTE_URL || "https://korean-law-mcp.fly.dev/mcp";

/**
 * MCP 원격 서버에 연결하여 도구를 호출합니다.
 * korean-law-mcp의 87개 법률 도구를 Vercel 서버리스에서도 사용 가능합니다.
 */
async function createMcpClient(): Promise<{ client: Client; transport: StreamableHTTPClientTransport }> {
  // HTTP transport로 원격 MCP 서버에 연결
  const transport = new StreamableHTTPClientTransport(new URL(MCP_REMOTE_URL));
  const client = new Client(
    { name: "refund-expedition", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  return { client, transport };
}

/**
 * MCP 도구를 호출하고 결과를 반환합니다.
 */
export async function callMcpTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  let transport: StreamableHTTPClientTransport | null = null;

  try {
    const connection = await createMcpClient();
    transport = connection.transport;

    const result = await connection.client.callTool({
      name: toolName,
      arguments: args,
    });

    return result;
  } catch (error) {
    console.error(`MCP tool call failed: ${toolName}`, error);
    throw error;
  } finally {
    if (transport) {
      try {
        await transport.close();
      } catch {
        // 연결 종료 에러 무시
      }
    }
  }
}

/**
 * 법령 검색 (search_law)
 */
export async function searchLaw(query: string) {
  return callMcpTool("search_law", { query });
}

/**
 * 법령 전문 조회 (get_law_text)
 */
export async function getLawText(lawName: string, article?: string) {
  const args: Record<string, unknown> = { lawName };
  if (article) args.jo = article;
  return callMcpTool("get_law_text", args);
}

/**
 * 판례 검색 (search_precedents)
 */
export async function searchPrecedents(query: string) {
  return callMcpTool("search_precedents", { query });
}

/**
 * 공정위 결정 검색 (search_ftc_decisions)
 */
export async function searchFtcDecisions(query: string) {
  return callMcpTool("search_ftc_decisions", { query });
}

/**
 * 분쟁 준비 체인 도구 (chain_dispute_prep)
 * 여러 법률 검색을 한 번에 수행
 */
export async function chainDisputePrep(query: string) {
  return callMcpTool("chain_dispute_prep", { query });
}

/**
 * 카테고리별 법령 검색을 수행합니다.
 * MCP 호출 실패 시 폴백 데이터를 반환합니다.
 */
export async function searchLawsByCategory(category: string, description: string): Promise<string[]> {
  const results: string[] = [];

  try {
    switch (category) {
      case 'gym': {
        // 방문판매법 검색
        const lawResult = await searchLaw("방문판매 등에 관한 법률 계속거래 해지");
        if (lawResult) results.push(JSON.stringify(lawResult));

        // 소비자분쟁해결기준 검색
        const consumerResult = await searchLaw("소비자분쟁해결기준 체육시설업");
        if (consumerResult) results.push(JSON.stringify(consumerResult));
        break;
      }
      case 'wedding': {
        // 예식장 표준약관 검색
        const weddingResult = await searchLaw("예식장업 표준약관");
        if (weddingResult) results.push(JSON.stringify(weddingResult));

        // 공정위 결정 검색
        const ftcResult = await searchFtcDecisions("예식장 위약금");
        if (ftcResult) results.push(JSON.stringify(ftcResult));
        break;
      }
      case 'travel': {
        // 소비자분쟁해결기준 숙박 검색
        const travelResult = await searchLaw("소비자분쟁해결기준 숙박업");
        if (travelResult) results.push(JSON.stringify(travelResult));
        break;
      }
      case 'medical': {
        // 의료서비스 관련 법령 검색
        const medicalResult = await searchLaw("소비자분쟁해결기준 의료서비스 성형외과");
        if (medicalResult) results.push(JSON.stringify(medicalResult));
        
        const medLawResult = await searchLaw("의료법 설명의무");
        if (medLawResult) results.push(JSON.stringify(medLawResult));
        break;
      }
    }

    // 상황 설명으로 분쟁 준비 검색
    if (description) {
      try {
        const disputeResult = await chainDisputePrep(description);
        if (disputeResult) results.push(JSON.stringify(disputeResult));
      } catch {
        // chain tool 실패 시 무시
      }
    }
  } catch (error) {
    console.error("MCP search failed, using fallback", error);
  }

  return results;
}
