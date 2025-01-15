
import litellm
import yaml
import os
import re
import javalang
import json
import xml.etree.ElementTree as ET
import esprima
import ast
import pycparser  
from collections import defaultdict
import traceback
import re
import json
import magic  
from dotenv import load_dotenv
from py2neo import Graph, Node, Relationship

import os

def connect_to_neo4j(uri, username, password):
    return Graph(uri, auth=(username, password))
load_dotenv()

claude_api_key = os.getenv("CLAUD_API_KEY")
open_api_key = os.getenv("OPENAI_API_KEY")

design_patterns_path = "./design_patterns.txt"


def detect_file_type(file_path):
    try:
        mime = magic.Magic(mime=True)
        file_type = mime.from_file(file_path)
        return file_type
    except Exception as e:
        print(f"Error detecting file type: {e}")
        return None

def load_litellm_config(yaml_path="litellm_config.yaml"):
    if not os.path.exists(yaml_path):
        raise FileNotFoundError(f"YAML configuration file not found at {yaml_path}")
    with open(yaml_path, "r") as file:
        config = yaml.safe_load(file)
    return config

def determine_file_type(file_path):
    file_extension = os.path.splitext(file_path)[1].lower()
    config_extensions = {".yaml", ".yml", ".json", ".env", ".toml", ".ini", ".cfg"}
    return "config" if file_extension in config_extensions else "source"

def sanitize_input_content(content):
    max_content_length = 100000
    if len(content) > max_content_length:
        print(f"Content truncated to {max_content_length} characters")
        return content[:max_content_length]
    return content

def ai_extract_compliance_sections(file_content, config, selected_model, provider):
    prompt = f"""
    Task: Extract and Structure Guidelines from the Compliance Document
    
    Input Document:
    {sanitize_input_content(file_content)}
    
    Please analyze the document and extract guidelines for the following sections. Format your response using the exact structure below:
    
    ##review##
    [Extract all guidelines related to code review, best practices, and quality standards]
    ##
    
    ##documentation##
    [Extract all guidelines related to documentation requirements and standards]
    ##
    
    ##comments##
    [Extract all guidelines related to code comments and inline documentation]
    ##
    
    ##knowledge_graph##
    [Extract all guidelines related to knowledge graph structure and representation]
    ##
    
    If any section is not explicitly covered in the document, provide sensible default guidelines based on industry standards.
    """
    
    try:
        response = generate_litellm_response(prompt, config, selected_model, provider)
        extracted_content = response['choices'][0]['message']['content']
        
        sections = {
            'review': 'Default review guidelines.',
            'documentation': 'Default documentation guidelines.',
            'comments': 'Default comments guidelines.',
            'knowledge_graph': 'Default knowledge graph guidelines.'
        }
        
        
        patterns = {
            'review': r'##review##\s*(.*?)\s*##',
            'documentation': r'##documentation##\s*(.*?)\s*##',
            'comments': r'##comments##\s*(.*?)\s*##',
            'knowledge_graph': r'##knowledge_graph##\s*(.*?)\s*##'
        }
        
        for section, pattern in patterns.items():
            match = re.search(pattern, extracted_content, re.DOTALL)
            if match and match.group(1).strip():
                sections[section] = match.group(1).strip()
        
        return sections
        
    except Exception as e:
        print(f"Error extracting compliance sections: {e}")
        return {
            'review': 'Error occurred. Using default review guidelines.',
            'documentation': 'Error occurred. Using default documentation guidelines.',
            'comments': 'Error occurred. Using default comments guidelines.',
            'knowledge_graph': 'Error occurred. Using default knowledge graph guidelines.'
        }
def load_compliance_file(compliance_file_path, config, selected_model, provider):
    default_sections = {
        "review": "Default review guidelines.",
        "documentation": "Default documentation guidelines.",
        "comments": "Default comments guidelines.",
        "knowledge_graph" : "Default Knowledge graph"
    }
    if compliance_file_path is None or not os.path.exists(compliance_file_path):
        print("No compliance file provided or file not found. Using default guidelines.")
        return default_sections
    try:
        file_type = detect_file_type(compliance_file_path)
        
        with open(compliance_file_path, "r", encoding='utf-8') as file:
            content = file.read()
        if not content.strip():
            print("Compliance file is empty. Using default guidelines.")
            return default_sections
        max_file_size = 50000
        if len(content) > max_file_size:
            print(f"File size exceeds {max_file_size} characters. Truncating...")
            content = content[:max_file_size]
        extracted_sections = ai_extract_compliance_sections(
            content, config, selected_model, provider
        )
        for section in ['review', 'documentation', 'comments','knowledge_graph']:
            if not extracted_sections[section]:
                extracted_sections[section] = default_sections[section]
        return extracted_sections
    except Exception as e:
        print(f"Unexpected error processing compliance file: {e}")
        return default_sections



class RepositoryAnalyzer:
    def __init__(self, repo_path):
        """
        Initialize the Repository Analyzer with a given repository path.
        
        Args:
            repo_path (str): Full path to the repository root
        """
        self.repo_path = repo_path
        self.repository_structure = {}

    def analyze_repository(self):
        """
        Analyze the repository structure and contents.
        
        Returns:
            dict: Detailed repository structure with file and code insights
        """
        self.repository_structure = {
            'root': self.repo_path,
            'directories': [],
            'files': []
        }
        
        for root, dirs, files in os.walk(self.repo_path):
            current_dir = {
                'path': root,
                'name': os.path.basename(root),
                'subdirectories': dirs,
                'files': []
            }
            
            for file in files:
                file_path = os.path.join(root, file)
                file_info = self._analyze_file(file_path)
                current_dir['files'].append(file_info)
            
            self.repository_structure['directories'].append(current_dir)
        
        return self.repository_structure

    def _analyze_file(self, file_path):
        """
        Analyze individual files based on their type.
        
        Args:
            file_path (str): Full path to the file
        
        Returns:
            dict: File information
        """
        file_name = os.path.basename(file_path)
        file_extension = os.path.splitext(file_name)[1].lower()
        
        file_info = {
            'name': file_name,
            'path': file_path,
            'extension': file_extension,
            'size': os.path.getsize(file_path)
        }
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
             
            if file_extension == '.py':
                file_info.update(self._parse_python_file(content))
            elif file_extension == '.java':
                file_info.update(self._parse_java_file(content))
            elif file_extension in ['.js', '.jsx', '.ts', '.tsx']:
                file_info.update(self._parse_javascript_file(content))
            elif file_extension == '.json':
                file_info.update(self._parse_json_file(content))
            elif file_extension == '.xml':
                file_info.update(self._parse_xml_file(content))
            elif file_extension in ['.cpp', '.h']:
                file_info.update(self._parse_cpp_file(content))
            elif file_extension == '.cs':
                file_info.update(self._parse_csharp_file(content))
        
        except Exception as e:
            file_info['parsing_error'] = str(e)
         
        return file_info

 
    def _parse_python_file(self, content):
        try:
            tree = ast.parse(content)
            
            class_methods = {}
            standalone_functions = {}  # Changed to dict to store function details
            classes = []
            global_vars = []
            docstrings = []
            
            # Get module docstring
            module_doc = ast.get_docstring(tree)
            if module_doc:
                docstrings.append({
                    'type': 'module',
                    'content': module_doc
                })
            
            for node in ast.walk(tree):
                # Class parsing
                if isinstance(node, ast.ClassDef):
                    class_doc = ast.get_docstring(node)
                    class_info = {
                        'name': node.name,
                        'methods': [],
                        'attributes': [],
                        'docstring': class_doc
                    }
                    
                    for item in node.body:
                        # Method parsing
                        if isinstance(item, ast.FunctionDef):
                            method_doc = ast.get_docstring(item)
                            method_info = {
                                'name': item.name,
                                'parameters': [arg.arg for arg in item.args.args],
                                'docstring': method_doc
                            }
                            class_info['methods'].append(method_info)
                        
                        # Class attribute parsing
                        elif isinstance(item, ast.Assign):
                            for target in item.targets:
                                if isinstance(target, ast.Name):
                                    class_info['attributes'].append(target.id)
                    
                    classes.append(class_info)
                
                # Standalone function parsing
                elif isinstance(node, ast.FunctionDef):
                    if not any(node.name in method['name'] for class_info in classes 
                            for method in class_info['methods']):
                        func_doc = ast.get_docstring(node)
                        standalone_functions[node.name] = {
                            'parameters': [arg.arg for arg in node.args.args],
                            'docstring': func_doc
                        }
                
                # Global variable parsing
                elif isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name):
                    if not any(node.targets[0].id in class_info['attributes'] 
                            for class_info in classes):
                        var_name = node.targets[0].id
                        # Check if it's a constant (uppercase)
                        is_constant = var_name.isupper()
                        global_vars.append({
                            'name': var_name,
                            'is_constant': is_constant
                        })
            
            return {
                'classes': classes,
                'functions': standalone_functions,
                'imports': [node.names[0].name for node in ast.walk(tree) 
                        if isinstance(node, ast.Import)],
                'global_variables': global_vars,
                'docstrings': docstrings
            }
        except Exception as e:
            return {'python_parsing_error': str(e)}

    def generate_summary_report(self):
        report = f"Repository Analysis Report: {self.repo_path}\n"
        report += "=" * 50 + "\n"
        
        for directory in self.repository_structure['directories']:
            report += f"\nDirectory: {directory['path']}\n"
            report += "-" * 30 + "\n"
            
            for file_info in directory['files']:
                report += f"File: {file_info['name']} (Type: {file_info['extension']})\n"
                if 'classes' in file_info:
                    report += f"  Classes: {', '.join(file_info.get('classes', []))}\n"
                if 'functions' in file_info:
                    report += f"  Functions: {', '.join(file_info.get('functions', []))}\n"
        
        return report


def generate_litellm_response(prompt, config, selected_model, provider):
    if provider == "openai":
        return litellm.completion(
            model=config['models'][selected_model]["model"],
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=3000,
            seed = 42,
            top_p=0.95,
            api_key=open_api_key
        )
    elif provider == "anthropic":
        return litellm.completion(
            model=config['models'][selected_model]["model"],
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            seed=42,
            top_p=0.85,
            api_key=claude_api_key
        )

def load_additional_files(file_paths):
    combined_content = ""
    for file_path in file_paths:
        if os.path.exists(file_path):
            with open(file_path, 'r') as file:
                combined_content += file.read() + "\n\n"
            print(f"Successfully loaded additional file: {file_path}")
        else:
            print(f"Warning: File {file_path} not found. Skipping it.")
    return combined_content

def generate_comments_or_docstrings(file_snippet, selected_model, provider, config, compliance_sections):
    comments_guidelines = compliance_sections.get('comments', 'Default comments guidelines.')
    prompt = f"""
        Source Code:
        {file_snippet}
        Comments Guidelines:
        {comments_guidelines}

        Generate comments and docstrings for the provided source code, strictly adhering to the specified comment guidelines while ensuring all instructions outlined below remain intact.

        Instructions:
        1. Generate detailed and meaningful inline comments or docstrings for every part of the code.
        2. Provide a clear explanation for the purpose and functionality of each function, class, constructor, destructor, interface, and any other code block.
        3. Explain the imports and their relevance to the code.
        4. Clarify any complex logic or operations within the code, breaking it down for better understanding.
        5. For functions and classes, describe their arguments, return values, and any side effects.
        6. Use language-appropriate comment styles, such as docstrings for functions/classes and inline comments for specific code lines.
        7. Prioritize readability and maintainability, ensuring the code's purpose is easily understandable.
        8. Make sure to provide context for the code and explain how different components interact.

    """
    try:
        response = generate_litellm_response(prompt, config, selected_model, provider)
        return response['choices'][0]['message']['content']
    except Exception as e:
        print(f"Error in comments generation: {e}")
        return "Comments generation failed. Default placeholder."
def generate_documentation(file_snippet, selected_model, provider, config, compliance_sections, file_extension, file_type):
    documentation_libraries = {
        ".java": "Javadoc", ".py": "Pydoc", ".js": "JSDoc",".jsx":"JSDOC",
        ".ts": "Typedoc", ".cpp": "Doxygen", ".c": "Doxygen", ".h": "Doxygen",
        ".rs":"Rustdoc",".rb":"RDoc",".kt":"Dokka",".go":"go doc",".r":"Roxygen2"
    }
    documentation_guidelines = compliance_sections.get(
        'documentation', 'Default documentation guidelines.'
    )
    if file_type == "source":
        doc_library = documentation_libraries.get(file_extension, "Generic")
        prompt = f"""
            Source Code:
            {file_snippet}
            Documentation guidelines:
            {documentation_guidelines}

            Generate documentation for the provided source code, strictly adhering to the specified documentation guidelines while ensuring all requirements outlined below remain intact.
           
            Follow these specific requirements:
            1. *Code documentation*: Use {doc_library} conventions and syntax strictly to generate the source code documentation.

            2. Ensure the output is professional, structured, and ready for use in {doc_library}.

            3. *Code Summary*: Provide a comprehensive summary of what the source code does and its purpose.
            
            4. *Tree Structure*:
               - Create a hierarchical tree structure of the source code, detailing:
                 - All classes and their contained functions.
                 - Each function with its variables and types.
                 - Include constructors, destructors, and interfaces in the tree.
            
            5. *Detailed Descriptions*:
               - Document each class, function, and code block in detail.
               - For each function:
                 - Explain its purpose.
                 - Describe its parameters (name, type, and purpose).
                 - Include return types and exceptions (if applicable).
               - For classes and interfaces:
                 - Explain their purpose and relationships (inheritance, interfaces, etc.).
                 - List their methods and properties, explaining their roles.
            """
    elif file_type == "config":
        prompt = f"""
        Configuration file:
        {file_snippet}
        Documentation Guidelines:
        {documentation_guidelines}
        Generate documentation for the provided configuration file, strictly adhering to the specified documentation guidelines while ensuring all requirements outlined below remain intact.
        Documentation Requirements:
        1. Explain purpose of configuration file
        2. Detail each configuration option
        3. Provide usage instructions
        """
    else:
        return "Unsupported file type for documentation generation."
    try:
        response = generate_litellm_response(prompt, config, selected_model, provider)
        return response['choices'][0]['message']['content']
    except Exception as e:
        print(f"Error in documentation generation: {e}")
        return "Documentation generation failed. Default placeholder."
    
def review_code_from_file(file_path, repository_details ,design_patterns_path, best_practices_path, review_file_path, additional_file_paths, comments_file_path, documentation_file_path, selected_model, provider, config,repo_file_structure, compliance_file_path=None): 
    print("Analyzing the file. Please wait...")
    file_type = determine_file_type(file_path)
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"Source file not found: {file_path}")
    with open(file_path, 'r') as file:
        file_content = file.read()
    file_extension = os.path.splitext(file_path)[1].lower()
    compliance_sections = load_compliance_file(
        compliance_file_path, config, selected_model, provider
    )
    additional_files_content = load_additional_files(additional_file_paths)
    full_content = file_content + "\n\n" + additional_files_content
    if file_type == "source":
        with open(design_patterns_path, "r") as patterns_file:
            design_patterns = patterns_file.read()
        prompt = f"""
        CONTEXTUAL INPUTS:
        - Primary Source Code: {file_content}
        - Compliance Guidelines: {compliance_sections['review']}
        - Additional Files Context: {additional_files_content}
        - Design Patterns Reference: {design_patterns}

        DETAILED ANALYTICAL REVIEW PROTOCOL 
        I. DESIGN PATTERNS AND ARCHITECTURAL ANALYSIS
        Objective: Comprehensive Design Pattern Mapping and Architectural Evaluation

        Design Patterns Identification:
        - Systematically cross-reference the provided design patterns with the current source code implementation
        - Detailed Pattern Mapping:
        * Identify explicitly implemented design patterns
        * Specify exact location and implementation method
        * Assess pattern application effectiveness
        * Evaluate architectural coherence

        Unimplemented Design Pattern Recommendations:
        - Analyze code structure to suggest:
        * Most appropriate unimplemented design patterns
        * Specific implementation strategies
        * Potential architectural improvements
        * Performance and maintainability benefits of recommended patterns

        II. ADDITIONAL FILES CONTEXTUAL INTEGRATION
        Comprehensive Interdependency Analysis:
        - Examine interactions between provided additional files from and primary source code
        - Deep Dive Investigations:
        * Shared dependency mapping
        * Cross-file architectural connections
        * Module interaction patterns
        * Potential refactoring opportunities

        III. CODING STYLE AND NAMING CONVENTION ASSESSMENT
        Naming Convention Evaluation:
        - Systematic Analysis of Naming Practices:
        * Class Naming: Consistency, descriptiveness, semantic clarity
        * Method/Function Naming: Action-driven nomenclature, verb usage, scope clarity
        * Variable Naming: Context-rich, type-indicative naming strategies
        * Constant Naming: Standardization, semantic meaning

        Coding Style Comprehensive Review:
        - Formatting Consistency
        - Indentation and Structural Uniformity
        - Whitespace and Line Break Optimization
        - Adherence to Language-Specific Styling Guidelines

        IV. CODE QUALITY AND PERFORMANCE INSIGHTS
        Technical Depth Analysis:
        - Detailed Functionality Explanation
        - Performance Characteristic Assessment
        - Complexity Metrics Evaluation
        - Optimization Potential Identification
        - Scalability and Future-Proofing Considerations

        V. STRATEGIC IMPROVEMENT RECOMMENDATIONS
        Actionable Enhancement Framework:
        - Prioritized Improvement Suggestions
            * Impact Assessment
            * Implementation Ease
            * Long-Term Maintainability
        - Concrete Refactoring Strategies
        - Best Practices Alignment
        - Performance Optimization Pathways

        Delivery Specifications:
        - Professional, Constructive Tone
        - Code-Specific Reference Points
        - Strategic, Forward-Looking Recommendations
        - Clear, Implementable Guidance

        GENERATE a comprehensive, context-aware review that transforms code analysis into a strategic architectural and quality enhancement roadmap.
    """
    elif file_type == "config":
        with open(best_practices_path, "r") as practices_file:
            best_practices = practices_file.read()
        prompt = f"""
        Configuration File:
        {file_content}
        Review Guidelines:
        {compliance_sections['review']}
        Additional Files:
        {additional_files_content}
        Best Practices:
        {best_practices}
        Generate review for the provided Source code , strictly adhering to the specified Review guidelines while ensuring all instructions outlined below remain intact.
        Instructions:
            1. Summarize the configuration file's purpose, structure, and key settings.
            2. Explain its integration with the system, referencing additional files where applicable.
            3. Review the code for adherence to best practices provided above , referring to the provided guidelines. 
                - If the code follows best practices mentioned in the guidelines, highlight them.
                - If the code doesn't adhere to the best practices, suggest improvements or alternatives that align with the provided guidelines.
            4. Evaluate clarity, maintainability, and organization, recommending better structuring if needed.
            5. Analyze external references (e.g., dependencies, imported files) and their relevance from the additional files section mentioned above.
            6. Identify potential issues (e.g., hardcoded data, incomplete settings) and provide actionable fixes.
            7. Suggest enhancements for flexibility, scalability, and alignment with project requirements.
            8. Recommend strategies for testing and validation to ensure correctness and compatibility.
        """
    else:
        print("Unsupported file type.")
        return
    response = generate_litellm_response(prompt, config, selected_model, provider)
    review_content = response['choices'][0]['message']['content']

    comments_content = generate_comments_or_docstrings(
        file_content, selected_model, provider, config, compliance_sections
    )
    documentation_content = generate_documentation(
        file_content, selected_model, provider, config, 
        compliance_sections, file_extension, file_type
    )
    codebase_structure=generate_code_basestructure(
        selected_model,provider,config,repository_details,compliance_sections
    )
    with open(review_file_path, 'a',encoding='utf-8') as review_file:
        review_file.write("Review for the file:\n")
        review_file.write(review_content + "\n\n")
    with open(comments_file_path, 'w',encoding='utf-8') as comments_file:
        comments_file.write("Generated Comments/Docstrings:\n")
        comments_file.write(comments_content + "\n\n")
    with open(documentation_file_path, 'w',encoding='utf-8') as documentation_file:
        documentation_file.write("Generated Documentation:\n")
        documentation_file.write(documentation_content + "\n\n")
    if(repository_details):
        with open(repo_file_structure, "w",encoding='utf-8') as file:
                file.write("\n\nCodeBase Structure :\n")
                file.write(codebase_structure+"\n\n")
    print("Analysis complete. Results saved successfully.")

def generate_code_basestructure(selected_model, provider, config, repository_details,compliance_sections):

    if not isinstance(repository_details, dict):
        raise TypeError(f"Expected 'repository_details' to be a dictionary, but got {type(repository_details)}")

    knowledge_graph_guidelines = compliance_sections.get('knowledge_graph', 'Default knowledge graph guidelines.')

    def analyze_directory_structure(repo_details):
        directory_analysis = []
        for directory in repo_details.get('directories', []):
            path = directory.get('path', '')
            subdirectories = directory.get('subdirectories', [])
            num_dirs = len(subdirectories)
            directory_analysis.append({
                "path": path,
                "num_dirs": num_dirs
            })
        return directory_analysis

    def analyze_naming(items):
        if not items:
            return []
        naming_patterns = []
        for item in items:
            if "_" in item:
                naming_patterns.append("snake_case")
            elif item.islower():
                naming_patterns.append("lowercase")
            elif item.isupper():
                naming_patterns.append("UPPERCASE")
            elif any(char.isdigit() for char in item):
                naming_patterns.append("includes_numbers")
            else:
                naming_patterns.append("camelCase or PascalCase")
        most_common_naming = max(set(naming_patterns), key=naming_patterns.count)
        return [{"path": item, "naming_pattern": most_common_naming} for item in items]

    def extract_patterns(repo_details):
        patterns = defaultdict(list)
        for directory in repo_details.get('directories', []):
            for file in directory.get('files', []):
                file_name = file.get('name', '')
                if file_name.endswith(".py"):
                    patterns["Python Modules"].append(file_name)
                elif file_name.endswith(".java"):
                    patterns["Java Modules"].append(file_name)
                elif file_name.endswith(".js"):
                    patterns["JavaScript Modules"].append(file_name)
                elif "config" in file_name.lower():
                    patterns["Configuration Files"].append(file_name)
                elif "test" in file_name.lower() or file_name.startswith("test_"):
                    patterns["Test Files"].append(file_name)
                else:
                    patterns["Other Files"].append(file_name)
        return patterns

    def analyze_overall_structure(directory_analysis, naming_analysis, patterns_analysis):
        summary = "The project has the following characteristics:\n"
        for analysis in directory_analysis:
            summary += f"- {analysis['path']} contains {analysis['num_dirs']} subdirectories.\n"
        for analysis in naming_analysis:
            summary += f"- {analysis['path']} follows the {analysis['naming_pattern']} naming convention.\n"
        for pattern, files in patterns_analysis.items():
            summary += f"- The project has the following {pattern}: {', '.join(files)}.\n"
        return {"summary": summary}

    
    directory_structure_analysis = analyze_directory_structure(repository_details)


    all_items = []
    for directory in repository_details.get('directories', []):
        all_items.extend(directory.get('subdirectories', []))
        all_items.extend([file.get('name', '') for file in directory.get('files', [])])
    naming_analysis = analyze_naming(all_items)

    
    patterns_analysis = extract_patterns(repository_details)

    overall_analysis = analyze_overall_structure(directory_structure_analysis, naming_analysis, patterns_analysis)

    prompt = f"""
    You are given a project repository with multiple directories and files. Your task is to:
    Knowledge Graph Guidelines:
        {knowledge_graph_guidelines}

    1. **Generate a hierarchical tree structure of the repository:**
     - Create a detailed tree structure for the source code, showing:
     - All **classes** and their contained **functions**.
     - Each **function** with its **variables** and **types**.
     - Include **constructors**, **destructors**, and **interfaces** (if applicable).
     - Indicate the **type** of each item (class, function, variable, etc.) as the tree structure is being formed.
   
    2. After generating the tree structure, analyze the following:
     - **File and folder naming conventions** used in the project.
     - **Directory structure patterns** across the repository (e.g., modularity, flat structure).
     - **Common coding styles and patterns** inferred from the file names and organization.
     - **Semantic insights** into how the codebase is structured.
     - Extract patterns based on **file types** (e.g., `.py`, `.java`, `.jsx`, `.xml`, etc.), **function names**, **constants**, and the overall structure.

    The structure of the repository is as follows:
    {repository_details}


    Insights:
    {overall_analysis['summary']}

    Please generate the tree structure first, followed by your analysis based on the points above.

    """
    try:
        response = generate_litellm_response(prompt, config, selected_model, provider)
        return response['choices'][0]['message']['content']
    except Exception as e:
        print(f"Error in codebase structure generation: {e}")
        return "Code base structure generation failed. Default placeholder."



def build_repository_knowledge_graph(graph, repository_details):
    """
    Build an enhanced knowledge graph with additional node types and relationships
    """
    graph.delete_all()
    
    repo_node = Node("Repository", name=repository_details['root'])
    graph.create(repo_node)
    
    node_registry = {repository_details['root']: repo_node}
    
    def create_class_structure(file_node, class_info):
        class_node = Node("Class", 
                         name=class_info['name'],
                         docstring=class_info.get('docstring', ''))
        graph.create(class_node)
        defines_class_rel = Relationship(file_node, "DEFINES", class_node)
        graph.create(defines_class_rel)
        
        # Create method nodes with enhanced information
        for method in class_info.get('methods', []):
            method_node = Node("Method",
                             name=method['name'],
                             parameters=','.join(method.get('parameters', [])),
                             docstring=method.get('docstring', ''))
            graph.create(method_node)
            has_method_rel = Relationship(class_node, "HAS_METHOD", method_node)
            graph.create(has_method_rel)
        
        # Create attribute nodes
        for attr in class_info.get('attributes', []):
            attr_node = Node("ClassAttribute", name=attr)
            graph.create(attr_node)
            has_attr_rel = Relationship(class_node, "HAS_ATTRIBUTE", attr_node)
            graph.create(has_attr_rel)
    
    def process_file(file_info, dir_node):
        file_node = Node("File",
                        name=file_info['name'],
                        path=file_info['path'],
                        extension=file_info['extension'],
                        size=file_info['size'])
        graph.create(file_node)
        
        contains_file_rel = Relationship(dir_node, "CONTAINS", file_node)
        graph.create(contains_file_rel)
        
        # Process classes
        if 'classes' in file_info:
            for class_info in file_info['classes']:
                create_class_structure(file_node, class_info)
        
        # Process functions with enhanced information
        if 'functions' in file_info:
            for func_name, func_info in file_info['functions'].items():
                func_node = Node("Function", 
                               name=func_name,
                               parameters=','.join(func_info.get('parameters', [])),
                               docstring=func_info.get('docstring', ''))
                graph.create(func_node)
                defines_func_rel = Relationship(file_node, "DEFINES", func_node)
                graph.create(defines_func_rel)
        
        # Process global variables
        if 'global_variables' in file_info:
            for var_info in file_info['global_variables']:
                node_type = "Constant" if var_info['is_constant'] else "Variable"
                var_node = Node(node_type, name=var_info['name'])
                graph.create(var_node)
                defines_var_rel = Relationship(file_node, "DEFINES", var_node)
                graph.create(defines_var_rel)
        
        # Process imports
        if 'imports' in file_info:
            for import_name in file_info['imports']:
                import_node = Node("Import", name=import_name)
                graph.create(import_node)
                imports_rel = Relationship(file_node, "IMPORTS", import_node)
                graph.create(imports_rel)
        
        # Process docstrings
        if 'docstrings' in file_info:
            for doc_info in file_info['docstrings']:
                if doc_info['type'] == 'module':
                    file_node['docstring'] = doc_info['content']
                    graph.push(file_node)
    
    def process_directory(directory, parent_node):
        dir_node = Node("Directory", 
                       path=directory['path'], 
                       name=directory['name'])
        graph.create(dir_node)
        node_registry[directory['path']] = dir_node
        
        contains_rel = Relationship(parent_node, "CONTAINS", dir_node)
        graph.create(contains_rel)
        
        for file_info in directory['files']:
            process_file(file_info, dir_node)
    
    for directory in repository_details['directories']:
        parent_path = os.path.dirname(directory['path'])
        parent_node = node_registry.get(parent_path, repo_node)
        process_directory(directory, parent_node)

def create_knowledge_graph(repository_details):
    """
    Create a Neo4j knowledge graph from repository details.
    
    Args:
        repository_details: Dictionary containing repository structure
    """
    try:
        
        graph = connect_to_neo4j(
            uri="neo4j://localhost:7687",  
            username="neo4j",             
            password="ggurkiratt"      
        )
        
        
        build_repository_knowledge_graph(graph, repository_details)
        
        print("Knowledge graph created successfully!")
        
        
        result = graph.run("""
            MATCH (n)
            RETURN 
                count(n) as nodes,
                count(DISTINCT labels(n)) as node_types
        """).data()[0]
        
        print(f"Graph Statistics:")
        print(f"Total nodes: {result['nodes']}")
        print(f"Node types: {result['node_types']}")
        
    except Exception as e:
        print(f"Error creating knowledge graph: {e}")






EXAMPLE_QUERIES = { 
    "View entire graph":"""
    MATCH (n) RETURN n LIMIT 300
    """,
    "list_all_files": """
        MATCH (f:File)
        RETURN f.name, f.extension, f.size
    """,
    "find_largest_files": """
        MATCH (f:File)
        RETURN f.name, f.size
        ORDER BY f.size DESC
        LIMIT 10
    """,
    "class_hierarchy": """
        MATCH (f:File)-[:DEFINES]->(c:Class)
        RETURN f.name, collect(c.name) as classes
    """,
    "function_count_by_file": """
        MATCH (f:File)-[:DEFINES]->(func:Function)
        RETURN f.name, count(func) as function_count
        ORDER BY function_count DESC
    """,
    "directory_structure": """
        MATCH p=(r:Repository)-[:CONTAINS*]->(d:Directory)
        RETURN p
    """
}

def generate_guidelines_document(files_input, config, selected_model, provider):
    """ 
    Generate a comprehensive guidelines document from codebase analysis
    
    Args:
        files_input (str or list): Either repository path or list of file paths
        config (dict): LiteLLM configuration
        selected_model (str): Selected AI model name
        provider (str): AI provider name
    """
    def parse_repository_files(repo_path):
        """Parse all relevant files from repository"""
        file_contents = {}
        for root, _, files in os.walk(repo_path):
            for file in files:
                if file.endswith(('.py', '.java', '.js', '.jsx', '.ts', '.tsx', '.cpp', '.h', '.cs')):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            file_contents[file_path] = f.read()
                    except Exception as e:
                        print(f"Error reading {file_path}: {e}")
        return file_contents

    def parse_individual_files(file_paths):
        """Parse specific files provided"""
        file_contents = {}
        for file_path in file_paths:
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        file_contents[file_path] = f.read()
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
            else:
                print(f"File not found: {file_path}")
        return file_contents

    def analyze_code_patterns(file_contents):
        """Analyze code for patterns and conventions"""
        analyzed_data = {
            'naming_patterns': defaultdict(list),
            'indentation_patterns': defaultdict(int),
            'comment_styles': defaultdict(int),
            'file_organization': defaultdict(int),
            'code_structure': defaultdict(list)
        }
        
        for file_path, content in file_contents.items():
            # Analyze naming conventions
            class_pattern = r'class\s+([A-Za-z_][A-Za-z0-9_]*)'
            function_pattern = r'def\s+([A-Za-z_][A-Za-z0-9_]*)'
            variable_pattern = r'([a-zA-Z_][a-zA-Z0-9_]*)\s*='
            
            classes = re.findall(class_pattern, content)
            functions = re.findall(function_pattern, content)
            variables = re.findall(variable_pattern, content)
            
            analyzed_data['naming_patterns']['classes'].extend(classes)
            analyzed_data['naming_patterns']['functions'].extend(functions)
            analyzed_data['naming_patterns']['variables'].extend(variables)
            
            
            lines = content.split('\n')
            for line in lines:
                if line.strip():
                    indent = len(line) - len(line.lstrip())
                    analyzed_data['indentation_patterns'][indent] += 1
            
            
            docstring_pattern = r'"""[\s\S]*?"""'
            inline_comment_pattern = r'#.*$'
            
            docstrings = re.findall(docstring_pattern, content)
            inline_comments = re.findall(inline_comment_pattern, content, re.MULTILINE)
            
            analyzed_data['comment_styles']['docstrings'] += len(docstrings)
            analyzed_data['comment_styles']['inline'] += len(inline_comments)
            
        
            class_count = len(classes)
            function_count = len(functions)
            analyzed_data['file_organization']['classes_per_file'] += class_count
            analyzed_data['file_organization']['functions_per_file'] += function_count
            
        return analyzed_data

    def generate_guidelines_prompt(analyzed_data, file_contents):
        """Generate AI prompt for guidelines creation"""
        prompt = f"""
            Create a comprehensive documentation of existing coding patterns, standards, and practices based on the analyzed codebase or the files. Focus exclusively on current implementations and standards.

             Analyzed Context:
    - Files analyzed: {len(file_contents)}
    - File types present: {', '.join(set(f.split('.')[-1] for f in file_contents.keys()))}
    - Core metrics:
      * Classes: {', '.join(analyzed_data['naming_patterns']['classes'][:5])}
      * Functions: {', '.join(analyzed_data['naming_patterns']['functions'][:5])}
      * Variables: {', '.join(analyzed_data['naming_patterns']['variables'][:5])}
      * Documentation density: {analyzed_data['comment_styles']['docstrings'] + analyzed_data['comment_styles']['inline']}

    Document these aspects based STRICTLY on existing patterns also do not recommend what changes can be make only what have used in the codebase or the files:

    1. NAMING CONVENTIONS
    - File naming patterns
    - Directory naming structure
    - Class naming formats
    - Function/method naming formats
    - Variable naming patterns
    - Constant naming conventions
    - Parameter naming standards
    - Interface/abstract class naming
    - Test file naming
    - Special case naming patterns

    2. CODE STYLE & FORMATTING
    - Indentation type and depth
    - Line spacing patterns
    - Line length practices
    - Trailing whitespace handling
    - Bracket placement
    - Operator spacing
    - Comma and semicolon formatting
    - String quote usage (single/double)
    - Continuation line alignment
    - Array and object formatting

    3. LINT CONDITIONS
    - Active lint rules
    - Enforced syntax patterns
    - Code complexity thresholds
    - Unused variable handling
    - Import organization rules
    - Type checking requirements
    - Error handling patterns
    - Console logging rules
    - Function complexity limits
    - Cyclomatic complexity patterns

    4. STRUCTURAL PATTERNS
    - Directory hierarchy
    - File organization
    - Class structure patterns
    - Function organization
    - Module patterns
    - Component organization
    - Test structure
    - Resource organization
    - Configuration file placement
    - Build artifact organization

    5. DOCUMENTATION STANDARDS
    - Comment style patterns
    - Documentation format
    - API documentation
    - Class documentation
    - Method documentation
    - Parameter documentation
    - Return value documentation
    - Exception documentation
    - Type hint usage
    - Inline comment patterns

    6. STYLING SPECIFICS
    - CSS/SCSS organization
    - Component styling patterns
    - Media query handling
    - Theme implementation
    - Style inheritance patterns
    - CSS class naming
    - Style scoping approaches
    - Responsive design patterns
    - Animation conventions
    - UI component styling

    7. TECHNICAL IMPLEMENTATION
    - Design pattern usage
    - Error handling implementation
    - Logging mechanisms
    - Testing approaches
    - Database interaction patterns
    - API integration methods
    - Authentication handling
    - State management
    - Cache implementation
    - Performance optimization patterns

    Requirements:
    - Document ONLY existing patterns
    - NO suggestions or improvements
    - NO comparative analysis
    - NO best practice recommendations
    - Include ONLY implemented standards
    - Use objective, descriptive language
    - Focus on current implementation details
    - Document edge cases and exceptions
    - Include platform-specific patterns
    - Note technology-specific conventions

    Format using clear Markdown structure, emphasizing hierarchy and organization.
    """
        return prompt

    try:
        
        if isinstance(files_input, str):
           
            file_contents = parse_repository_files(files_input)
        else:
            
            file_contents = parse_individual_files(files_input)

        if not file_contents:
            raise ValueError("No valid files found to analyze")

      
        analyzed_data = analyze_code_patterns(file_contents)

       
        prompt = generate_guidelines_prompt(analyzed_data, file_contents)
        response = generate_litellm_response(prompt, config, selected_model, provider)
        guidelines_content = response['choices'][0]['message']['content']

        with open("guidelines.docx", "w", encoding='utf-8') as f:
            f.write(guidelines_content)

        print("Guidelines document generated successfully!")
        return guidelines_content

    except Exception as e:
        print(f"Error generating guidelines document: {e}")
        return None
def main():
    try:
        config = load_litellm_config()
        print("Available Models:")
        for model in config['models']:
            print(f"- {model}")
        selected_model = input("Enter the selected model name: ")
        provider = config['models'][selected_model]["provider"]

        
        generate_guidelines = input("Do you want to generate guidelines document? (y/n): ").lower().strip()
        
        if generate_guidelines == 'y':
            input_type = input("Do you want to analyze specific files or entire codebase? (files/codebase): ").lower().strip()
            
            if input_type == 'files':
                files_input = input("Enter comma-separated file paths to analyze: ").strip()
                files_list = [path.strip() for path in files_input.split(',') if path.strip()]
                if not files_list:
                    print("No valid file paths provided.")
                    return
                guidelines_content = generate_guidelines_document(files_list, config, selected_model, provider)
            
            elif input_type == 'codebase':
                repo_path = input("Enter the path of the codebase repository: ").strip()
                if not os.path.exists(repo_path):
                    print("Invalid repository path.")
                    return
                guidelines_content = generate_guidelines_document(repo_path, config, selected_model, provider)
            
            else:
                print("Invalid input type selected.")
                return
            
            if guidelines_content:
                print("Guidelines document generated successfully at 'guidelines.docx'")
        repo_path = input("Enter the path of the repository (optional, press Enter to skip): ").strip() or None
        file_path = input("Enter the path of the file to analyze: ")
            
        compliance_file_path = input("Enter the path of the compliance file (optional, press Enter to skip): ").strip() or None
        additional_file_path = input("Enter additional file paths separated by commas: ")
        additional_file_paths = [path.strip() for path in additional_file_path.split(",") if path.strip()]
            
        review_file_path = "./review_file.txt"
        comments_file_path = "./comments_file.txt"
        documentation_file_path = "./documentation_file.txt"
        best_practices_path = "./best_practices.txt"
        repo_file_structure = "./codebase_structure.txt"
            
        analyzer = RepositoryAnalyzer(repo_path)
        repository_details = analyzer.analyze_repository()
        
        create_knowledge_graph(repository_details)
            
        
        print("Repository details:", repository_details)
            
        review_code_from_file(
                file_path, repository_details, design_patterns_path, best_practices_path, 
                review_file_path, additional_file_paths, comments_file_path, 
                documentation_file_path, selected_model, provider, config,
                repo_file_structure, compliance_file_path
            )
            
    except Exception as e:
        print(f"An error occurred: {e}")
        traceback.print_exc()
if __name__ == "__main__":
    main()
 

